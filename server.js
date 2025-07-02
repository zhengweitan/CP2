//server.js - Fixed Version
const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
// Serve login.html at the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Database setup
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Connected to SQLite database');
    
    // Enable foreign key constraints
    db.run('PRAGMA foreign_keys = ON');
    
    // Create tables sequentially to avoid dependencies issues
    db.serialize(() => {
      // Create users table first
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'lecturer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) console.error('Error creating users table:', err);
      });

      // Then create courses table
      db.run(`CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        credit_hours INTEGER NOT NULL,
        department TEXT NOT NULL
      )`, (err) => {
        if (err) console.error('Error creating courses table:', err);
      });

      // Then create syllabi table with foreign keys
      db.run(`CREATE TABLE IF NOT EXISTS syllabi (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER NOT NULL,
        lecturer_id INTEGER NOT NULL,
        version TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        submitted_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(course_id) REFERENCES courses(id),
        FOREIGN KEY(lecturer_id) REFERENCES users(id)
      )`, (err) => {
        if (err) console.error('Error creating syllabi table:', err);
      });

      // Then create syllabus_data table
      db.run(`CREATE TABLE IF NOT EXISTS syllabus_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        syllabus_id INTEGER NOT NULL,
        section TEXT NOT NULL,
        content TEXT NOT NULL,
        FOREIGN KEY(syllabus_id) REFERENCES syllabi(id) ON DELETE CASCADE
      )`, (err) => {
        if (err) console.error('Error creating syllabus_data table:', err);
      });

      // Then create notifications table
      db.run(`CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL,
        related_id INTEGER,
        is_read BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )`, (err) => {
        if (err) console.error('Error creating notifications table:', err);
      });

      // Create default data AFTER tables are created
      setTimeout(() => {
        createDefaultData();
      }, 100);
    });
  }
});

// Function to create default data
function createDefaultData() {
  // Create default admin account if not exists
  db.get("SELECT id FROM users WHERE username = 'admin'", (err, row) => {
    if (!row) {
      db.run(
        "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
        ['admin', '123', 'admin'],
        function(err) {
          if (err) {
            console.error('Error creating admin account:', err);
          } else {
            console.log('Default admin account created with ID:', this.lastID);
            console.log('Username: admin');
            console.log('Password: 123');
          }
        }
      );
    }
  });

  // Pre-populate some course data
  const courses = [
    { code: 'CS101', name: 'Introduction to Computer Science', credit_hours: 3, department: 'Computer Science' },
    { code: 'MATH201', name: 'Advanced Mathematics', credit_hours: 4, department: 'Mathematics' },
    { code: 'ENG101', name: 'English Composition', credit_hours: 3, department: 'English' }
  ];

  courses.forEach(course => {
    db.get("SELECT id FROM courses WHERE code = ?", [course.code], (err, row) => {
      if (!row) {
        db.run(
          "INSERT INTO courses (code, name, credit_hours, department) VALUES (?, ?, ?, ?)",
          [course.code, course.name, course.credit_hours, course.department],
          function(err) {
            if (err) {
              console.error('Error inserting course:', err);
            } else {
              console.log(`Course ${course.code} created with ID:`, this.lastID);
            }
          }
        );
      }
    });
  });
}

// Signup endpoint
app.post('/signup', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).send('Username and password are required');
  }

  // Prevent registering with admin username
  if (username.toLowerCase() === 'admin') {
    return res.status(400).send('This username is reserved');
  }

  db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', 
    [username, password, 'lecturer'], // Force role to lecturer
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).send('Username already exists');
        }
        return res.status(500).send('Database error');
      }
      console.log('New lecturer account created with ID:', this.lastID);
      res.send('Lecturer account created successfully');
    }
  );
});

// Login endpoint
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
  }

  db.get('SELECT * FROM users WHERE username = ? AND password = ?', 
      [username, password], 
      (err, row) => {
          if (err) {
              console.error('Database error:', err);
              return res.status(500).json({ error: 'Database error' });
          }
          if (!row) {
              return res.status(401).json({ error: 'Invalid credentials' });
          }
          
          res.json({
              message: 'Login successful',
              role: row.role,
              username: row.username,
              userId: row.id // Include user ID for later use
          });
      }
  );
});

// FIXED SYLLABUS SUBMISSION ENDPOINT
app.post('/api/syllabus/submit', (req, res) => {
  const { syllabusData } = req.body;
  
  if (!syllabusData) {
    return res.status(400).json({ 
      success: false,
      message: 'Missing syllabus data' 
    });
  }

  // First, let's find a valid lecturer and course
  db.serialize(() => {
    // Get first available lecturer (in real app, this would come from session)
    db.get("SELECT id FROM users WHERE role = 'lecturer' LIMIT 1", (err, lecturer) => {
      if (err || !lecturer) {
        console.error('No lecturer found:', err);
        return res.status(500).json({
          success: false,
          message: 'No lecturer account found. Please create a lecturer account first.'
        });
      }

      // Get or create course based on form data
      const courseCode = syllabusData.courseInfo.courseCode;
      const courseName = syllabusData.courseInfo.courseName;
      const creditValue = syllabusData.courseInfo.creditValue;

      db.get("SELECT id FROM courses WHERE code = ?", [courseCode], (err, course) => {
        if (err) {
          console.error('Error checking course:', err);
          return res.status(500).json({
            success: false,
            message: 'Database error checking course'
          });
        }

        if (course) {
          // Course exists, use it
          insertSyllabus(course.id, lecturer.id, syllabusData, res);
        } else {
          // Create new course
          db.run(
            "INSERT INTO courses (code, name, credit_hours, department) VALUES (?, ?, ?, ?)",
            [courseCode, courseName, creditValue, 'General'],
            function(insertErr) {
              if (insertErr) {
                console.error('Error creating course:', insertErr);
                return res.status(500).json({
                  success: false,
                  message: 'Failed to create course'
                });
              }
              
              console.log('New course created with ID:', this.lastID);
              insertSyllabus(this.lastID, lecturer.id, syllabusData, res);
            }
          );
        }
      });
    });
  });
});

// Helper function to insert syllabus
function insertSyllabus(courseId, lecturerId, syllabusData, res) {
  db.run('BEGIN TRANSACTION');

  // Insert syllabus record
  db.run(
    `INSERT INTO syllabi (course_id, lecturer_id, version, status, submitted_at) 
     VALUES (?, ?, ?, ?, datetime('now'))`,
    [courseId, lecturerId, '1.0', 'submitted'],
    function(err) {
      if (err) {
        db.run('ROLLBACK');
        console.error('Database error inserting syllabus:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to save syllabus: ' + err.message
        });
      }

      const syllabus_id = this.lastID;
      console.log('Syllabus created with ID:', syllabus_id);

      // Save all syllabus sections
      const sections = [
        { section: 'course_info', content: syllabusData.courseInfo },
        { section: 'learning_outcomes', content: syllabusData.learningOutcomes },
        { section: 'slt_data', content: syllabusData.sltData },
        { section: 'special_requirements', content: syllabusData.specialRequirements }
      ];

      let completed = 0;
      let hasError = false;

      sections.forEach(section => {
        db.run(
          `INSERT INTO syllabus_data (syllabus_id, section, content)
           VALUES (?, ?, ?)`,
          [syllabus_id, section.section, JSON.stringify(section.content)],
          (sectionErr) => {
            if (sectionErr) {
              console.error('Error saving section:', sectionErr);
              hasError = true;
            }

            if (++completed === sections.length) {
              if (hasError) {
                db.run('ROLLBACK');
                return res.status(500).json({
                  success: false,
                  message: 'Failed to save some syllabus sections'
                });
              }

              // Notify admins
              notifyAdmins(syllabus_id, lecturerId, (notifyErr) => {
                if (notifyErr) {
                  console.error('Warning: Failed to notify some admins:', notifyErr);
                  // Don't fail the entire operation for notification errors
                }

                db.run('COMMIT', (commitErr) => {
                  if (commitErr) {
                    console.error('Commit error:', commitErr);
                    return res.status(500).json({
                      success: false,
                      message: 'Failed to finalize submission'
                    });
                  }

                  res.json({
                    success: true,
                    syllabus_id,
                    message: 'Syllabus submitted successfully for approval'
                  });
                });
              });
            }
          }
        );
      });
    }
  );
}

// Helper function to notify admins
function notifyAdmins(syllabus_id, lecturer_id, callback) {
  db.all(
    `SELECT id FROM users WHERE role = 'admin'`,
    (err, admins) => {
      if (err) {
        console.error('Error finding admins:', err);
        return callback(err);
      }

      if (admins.length === 0) {
        console.warn('No admin users found to notify');
        return callback(); // No admins to notify
      }

      let notified = 0;
      let hasError = false;

      admins.forEach(admin => {
        db.run(
          `INSERT INTO notifications (user_id, message, type, related_id, created_at)
           VALUES (?, ?, ?, ?, datetime('now'))`,
          [
            admin.id,
            `New syllabus submitted for approval (ID: ${syllabus_id})`,
            'submission',
            syllabus_id
          ],
          (notifyErr) => {
            if (notifyErr) {
              console.error('Error creating notification:', notifyErr);
              hasError = true;
            }

            notified++;
            if (notified === admins.length) {
              callback(hasError ? new Error('Failed some notifications') : null);
            }
          }
        );
      });
    }
  );
}

// Serve HTML files
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'signup.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/lecturer', (req, res) => {
  res.sendFile(path.join(__dirname, 'lecturer.html'));
});

app.get('/create_syllabus', (req, res) => {
  res.sendFile(path.join(__dirname, 'create_syllabus.html'));
});

// Get notifications for current user
app.get('/notifications', (req, res) => {
  const userId = req.query.userId;
  
  db.all(
    `SELECT * FROM notifications 
     WHERE user_id = ? 
     ORDER BY created_at DESC`,
    [userId],
    (err, notifications) => {
      if (err) return res.status(500).send('Database error');
      res.json(notifications);
    }
  );
});

// Mark notification as read
app.post('/notifications/:id/read', (req, res) => {
  db.run(
    'UPDATE notifications SET is_read = 1 WHERE id = ?',
    [req.params.id],
    (err) => {
      if (err) return res.status(500).send('Database error');
      res.send('Notification marked as read');
    }
  );
});

app.post('/notifications/mark-all-read', (req, res) => {
    const userId = req.query.userId;
    
    db.run(
        'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
        [userId],
        (err) => {
            if (err) return res.status(500).send('Database error');
            res.send('All notifications marked as read');
        }
    );
});

// Get courses
app.get('/courses', (req, res) => {
    db.all('SELECT * FROM courses ORDER BY code', (err, courses) => {
        if (err) return res.status(500).send('Database error');
        res.json(courses);
    });
});

// Approval endpoints
// Approval endpoint
app.post('/api/syllabus/approve', (req, res) => {
  const { syllabusId, feedback } = req.body;
  
  if (!syllabusId) {
    return res.status(400).json({ error: 'Syllabus ID is required' });
  }

  db.serialize(() => {
    // First check if syllabus exists
    db.get('SELECT id FROM syllabi WHERE id = ?', [syllabusId], (err, syllabus) => {
      if (err || !syllabus) {
        console.error('Error finding syllabus:', err);
        return res.status(404).json({ error: 'Syllabus not found' });
      }

      // Update syllabus status
      db.run(
        "UPDATE syllabi SET status = 'approved', updated_at = datetime('now') WHERE id = ?",
        [syllabusId],
        function(updateErr) {
          if (updateErr) {
            console.error('Error approving syllabus:', updateErr);
            return res.status(500).json({ error: 'Database error' });
          }

          // Get lecturer ID to notify
          db.get(
            "SELECT lecturer_id FROM syllabi WHERE id = ?",
            [syllabusId],
            (notifyErr, syllabus) => {
              if (notifyErr || !syllabus) {
                console.error('Error finding syllabus:', notifyErr);
                // Still return success since the approval worked
                return res.json({ success: true });
              }

              // Create notification
              db.run(
                `INSERT INTO notifications (user_id, message, type, related_id, created_at)
                 VALUES (?, ?, ?, ?, datetime('now'))`,
                [
                  syllabus.lecturer_id,
                  `Your syllabus has been approved${feedback ? ` with feedback: ${feedback}` : ''}`,
                  'approval',
                  syllabusId
                ],
                (insertErr) => {
                  if (insertErr) console.error('Error creating notification:', insertErr);
                  res.json({ success: true });
                }
              );
            }
          );
        }
      );
    });
  });
});

// Rejection endpoint
app.post('/api/syllabus/reject', (req, res) => {
  const { syllabusId, feedback } = req.body;
  
  if (!syllabusId) {
    return res.status(400).json({ error: 'Syllabus ID is required' });
  }

  if (!feedback) {
    return res.status(400).json({ error: 'Feedback is required for rejection' });
  }

  db.serialize(() => {
    // First check if syllabus exists
    db.get('SELECT id FROM syllabi WHERE id = ?', [syllabusId], (err, syllabus) => {
      if (err || !syllabus) {
        console.error('Error finding syllabus:', err);
        return res.status(404).json({ error: 'Syllabus not found' });
      }

      // Update syllabus status
      db.run(
        "UPDATE syllabi SET status = 'rejected', updated_at = datetime('now') WHERE id = ?",
        [syllabusId],
        function(updateErr) {
          if (updateErr) {
            console.error('Error rejecting syllabus:', updateErr);
            return res.status(500).json({ error: 'Database error' });
          }

          // Get lecturer ID to notify
          db.get(
            "SELECT lecturer_id FROM syllabi WHERE id = ?",
            [syllabusId],
            (notifyErr, syllabus) => {
              if (notifyErr || !syllabus) {
                console.error('Error finding syllabus:', notifyErr);
                // Still return success since the rejection worked
                return res.json({ success: true });
              }

              // Create notification
              db.run(
                `INSERT INTO notifications (user_id, message, type, related_id, created_at)
                 VALUES (?, ?, ?, ?, datetime('now'))`,
                [
                  syllabus.lecturer_id,
                  `Your syllabus has been rejected. Feedback: ${feedback}`,
                  'rejection',
                  syllabusId
                ],
                (insertErr) => {
                  if (insertErr) console.error('Error creating notification:', insertErr);
                  res.json({ success: true });
                }
              );
            }
          );
        }
      );
    });
  });
});

// Get submissions with filtering
app.get('/api/syllabus/submissions', (req, res) => {
  const { userId, role, status } = req.query;
  const isAdmin = role === 'admin';

  let query = `
    SELECT s.id, c.code as course_code, c.name as course_name, 
           u.username as lecturer_name, s.version, s.status, s.submitted_at
    FROM syllabi s
    JOIN courses c ON s.course_id = c.id
    JOIN users u ON s.lecturer_id = u.id
  `;

  const params = [];

  if (!isAdmin) {
    query += ' WHERE s.lecturer_id = ?';
    params.push(userId);
  }

  if (status && status !== 'all') {
    query += isAdmin ? ' WHERE' : ' AND';
    query += ' s.status = ?';
    params.push(status);
  }

  query += ' ORDER BY s.submitted_at DESC';

  console.log('Executing query:', query, 'with params:', params); // Debug log

  db.all(query, params, (err, submissions) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json([]);
    }
    
    console.log('Found submissions:', submissions); // Debug log
    
    // Fallback to sample data if empty (for development only)
    if (submissions.length === 0 && process.env.NODE_ENV !== 'production') {
      const sampleData = getSampleSubmissions(isAdmin, status);
      console.log('Using sample data:', sampleData);
      return res.json(sampleData);
    }
    
    res.json(submissions);
  });
});


// Add this endpoint to your server.js
app.get('/api/syllabus/:id', (req, res) => {
  const syllabusId = req.params.id;

  db.serialize(() => {
    // Get basic syllabus info
    db.get(`
      SELECT s.*, c.code as course_code, c.name as course_name, 
             u.username as lecturer_name 
      FROM syllabi s
      JOIN courses c ON s.course_id = c.id
      JOIN users u ON s.lecturer_id = u.id
      WHERE s.id = ?
    `, [syllabusId], (err, syllabus) => {
      if (err || !syllabus) {
        console.error('Error fetching syllabus:', err);
        return res.status(404).json({ error: 'Syllabus not found' });
      }
      
      // Get all syllabus data sections
      db.all(`
        SELECT section, content 
        FROM syllabus_data 
        WHERE syllabus_id = ?
        ORDER BY id
      `, [syllabusId], (err, sections) => {
        if (err) {
          console.error('Error fetching syllabus sections:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        // Combine all data
        const result = {
          id: syllabus.id,
          course_code: syllabus.course_code,
          course_name: syllabus.course_name,
          lecturer_name: syllabus.lecturer_name,
          version: syllabus.version,
          status: syllabus.status,
          submitted_at: syllabus.submitted_at,
          created_at: syllabus.created_at
        };
        
        // Parse each section's content
        sections.forEach(section => {
          try {
            result[section.section] = JSON.parse(section.content);
          } catch (e) {
            console.error('Error parsing section content:', e);
            result[section.section] = {};
          }
        });
        
        res.json(result);
      });
    });
  });
});
// Helper function for sample data (development only)
function getSampleSubmissions(isAdmin, statusFilter) {
  const sampleData = [
    {
      id: 1,
      course_code: 'CS101',
      course_name: 'Introduction to Computer Science',
      lecturer_name: 'Dr. Smith',
      version: '1.0',
      status: 'submitted',
      submitted_at: new Date().toISOString()
    },
    {
      id: 2,
      course_code: 'MATH201',
      course_name: 'Advanced Mathematics',
      lecturer_name: 'Dr. Johnson',
      version: '1.1',
      status: 'approved',
      submitted_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 3,
      course_code: 'ENG101',
      course_name: 'English Composition',
      lecturer_name: 'Dr. Williams',
      version: '1.0',
      status: 'rejected',
      submitted_at: new Date(Date.now() - 172800000).toISOString()
    }
  ];

  let filteredData = sampleData;

  if (isAdmin) {
    // For admin, show all submissions
    if (statusFilter && statusFilter !== 'all') {
      filteredData = filteredData.filter(sub => sub.status === statusFilter);
    }
  } else {
    // For lecturer, only show their submissions (simulated as Dr. Smith)
    filteredData = filteredData.filter(sub => sub.lecturer_name === 'Dr. Smith');
    if (statusFilter && statusFilter !== 'all') {
      filteredData = filteredData.filter(sub => sub.status === statusFilter);
    }
  }

  return filteredData;
}

// Add this endpoint to server.js
// Update the resubmit endpoint
app.post('/api/syllabus/resubmit/:id', (req, res) => {
    const { id } = req.params;
    const { syllabusData } = req.body;

    db.serialize(() => {
        // First verify the syllabus exists and is rejected
        db.get(
            `SELECT id FROM syllabi 
             WHERE id = ? AND status = 'rejected'`,
            [id],
            (err, syllabus) => {
                if (err || !syllabus) {
                    console.error('Resubmission error:', err);
                    return res.status(404).json({
                        success: false,
                        message: 'Syllabus not found or not eligible for resubmission'
                    });
                }

                // Update the syllabus
                db.run(
                    `UPDATE syllabi 
                     SET status = 'submitted', 
                         version = CAST(version AS REAL) + 0.1,
                         updated_at = datetime('now')
                     WHERE id = ?`,
                    [id],
                    function(updateErr) {
                        if (updateErr) {
                            console.error('Update error:', updateErr);
                            return res.status(500).json({
                                success: false,
                                message: 'Failed to update syllabus'
                            });
                        }

                        // Delete old syllabus data
                        db.run(
                            'DELETE FROM syllabus_data WHERE syllabus_id = ?',
                            [id],
                            function(deleteErr) {
                                if (deleteErr) {
                                    db.run('ROLLBACK');
                                    return res.status(500).json({
                                        success: false,
                                        message: 'Failed to clear old data'
                                    });
                                }

                                // Insert new syllabus data
                                const sections = [
                                    { section: 'course_info', content: syllabusData.courseInfo },
                                    { section: 'learning_outcomes', content: syllabusData.learningOutcomes },
                                    { section: 'slt_data', content: syllabusData.sltData },
                                    { section: 'special_requirements', content: syllabusData.specialRequirements }
                                ];

                                let completed = 0;
                                let hasError = false;

                                sections.forEach(section => {
                                    db.run(
                                        `INSERT INTO syllabus_data 
                                         (syllabus_id, section, content)
                                         VALUES (?, ?, ?)`,
                                        [id, section.section, JSON.stringify(section.content)],
                                        (insertErr) => {
                                            if (insertErr) {
                                                console.error('Insert error:', insertErr);
                                                hasError = true;
                                            }

                                            if (++completed === sections.length) {
                                                if (hasError) {
                                                    db.run('ROLLBACK');
                                                    return res.status(500).json({
                                                        success: false,
                                                        message: 'Failed to save some sections'
                                                    });
                                                }

                                                db.run('COMMIT', (commitErr) => {
                                                    if (commitErr) {
                                                        return res.status(500).json({
                                                            success: false,
                                                            message: 'Commit failed'
                                                        });
                                                    }

                                                    res.json({
                                                        success: true,
                                                        message: 'Syllabus resubmitted successfully'
                                                    });
                                                });
                                            }
                                        }
                                    );
                                });
                            }
                        );
                    }
                );
            }
        );
    });
});

// Add unread count endpoint
app.get('/notifications/unread-count', (req, res) => {
    const userId = req.query.userId;
    
    db.get(
        `SELECT COUNT(*) as count FROM notifications 
         WHERE user_id = ? AND is_read = 0`,
        [userId],
        (err, row) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json({ count: row.count });
        }
    );
});

// Get syllabi for a specific lecturer
app.get('/api/syllabus/lecturer/:userId', (req, res) => {
  const lecturerId = req.params.userId;
  const status = req.query.status;
  const search = req.query.search;

  let query = `
    SELECT s.id, c.code as course_code, c.name as course_name, 
           s.version, s.status, s.updated_at, s.submitted_at
    FROM syllabi s
    JOIN courses c ON s.course_id = c.id
    WHERE s.lecturer_id = ?
  `;

  const params = [lecturerId];

  // Add status filter if provided
  if (status && status !== 'all') {
    query += ' AND s.status = ?';
    params.push(status);
  }

  // Add search filter if provided
  if (search) {
    query += ' AND (c.code LIKE ? OR c.name LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY s.updated_at DESC';

  console.log('Executing lecturer syllabi query:', query, 'with params:', params);

  db.all(query, params, (err, syllabi) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    console.log('Found syllabi for lecturer:', syllabi.length);
    res.json(syllabi);
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Debug endpoint to check database state
app.get('/debug/data', (req, res) => {
    db.serialize(() => {
        const results = {};
        
        db.all("SELECT * FROM users", (err, users) => {
            results.users = users;
            
            db.all("SELECT * FROM courses", (err, courses) => {
                results.courses = courses;
                
                db.all("SELECT * FROM syllabi", (err, syllabi) => {
                    results.syllabi = syllabi;
                    
                    res.json(results);
                });
            });
        });
    });
});

// Add this to your server.js for debugging
app.get('/debug/submissions', (req, res) => {
  db.all("SELECT * FROM syllabi", (err, syllabi) => {
    if (err) return res.status(500).send(err.message);
    res.json(syllabi);
  });
});

app.get('/debug/syllabus/:id', (req, res) => {
    const syllabusId = req.params.id;
    
    db.serialize(() => {
        db.get('SELECT * FROM syllabi WHERE id = ?', [syllabusId], (err, syllabus) => {
            if (err || !syllabus) {
                return res.status(404).send('Syllabus not found');
            }
            
            db.all('SELECT * FROM syllabus_data WHERE syllabus_id = ?', [syllabusId], (err, data) => {
                res.json({
                    syllabus: syllabus,
                    data: data
                });
            });
        });
    });
});

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Add this before your routes for debugging
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Add to server.js
app.delete('/api/syllabus/:id', (req, res) => {
  const syllabusId = req.params.id;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // First delete from syllabus_data (child table)
    db.run(
      'DELETE FROM syllabus_data WHERE syllabus_id = ?',
      [syllabusId],
      function(err) {
        if (err) {
          db.run('ROLLBACK');
          console.error('Error deleting syllabus data:', err);
          return res.status(500).json({
            success: false,
            message: 'Failed to delete syllabus data'
          });
        }

        // Then delete from syllabi (parent table)
        db.run(
          'DELETE FROM syllabi WHERE id = ?',
          [syllabusId],
          function(err) {
            if (err) {
              db.run('ROLLBACK');
              console.error('Error deleting syllabus:', err);
              return res.status(500).json({
                success: false,
                message: 'Failed to delete syllabus'
              });
            }

            db.run('COMMIT');
            res.json({
              success: true,
              message: 'Syllabus deleted successfully'
            });
          }
        );
      }
    );
  });
});