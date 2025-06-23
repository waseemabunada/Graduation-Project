const express = require('express');
const fs = require('fs')
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const morgan = require('morgan');
const app = express();
const cors = require('cors');
const PORT = 8000;

const {authMiddleware} = require('./middleware');

const { exec } = require('child_process');

app.use(express.json());
app.use('/students', express.static(path.join(__dirname, './students')));
app.use(morgan('dev'));
app.use(cors());
mongoose.connect('mongodb+srv://waseemabunada202:Waseem12345@cluster0.rwpecbs.mongodb.net/attendanceSystem?retryWrites=true&w=majority&appName=Cluster0')
.then(() => console.log('Connected to MongoDB'))
.catch(error => console.log(error));
// lecturer
const LecturerSchema = new mongoose.Schema({
  financialNumber: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const Lecturer = mongoose.model('Lecturer', LecturerSchema);
// student
const studentsSchema = new mongoose.Schema({
  student_image: { type: String, required: [true, 'student image is required'] },
  student_name: { type: String, required: [true, 'student name is required'] },
  student_email: { type: String, unique: true, required: [true, 'student email is required'] },
  student_number: {type: Number, unique: true, required: [true, 'student number is required'] },
});
const Student = mongoose.model('Student', studentsSchema);

// course
const courseSchema = new mongoose.Schema({
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lecturer'
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
  }],
  course_name: { type: String, required: true },
  course_number: { type: String, required: true },
  startAt: { type: String, required: true },
  duration_in_minutes: { type: Number, required: true },
  section_number: { type: Number, required: true },
  days: { type: [String], required: true, enum: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] },
  sessions: [{
    date: { type: Date, required: true, default: new Date() }, // Date of the session
    attendance_max_count: { type: Number, required: true }, // Maximum attendance count for the session
    attendance: [{
      student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' }, // Reference to the student
      time_of_attendance: { type: Date, required: true }, // Time of attendance
      attendance_count: { type: Number, default: 1 }, // Number of attendance records
    }],
  }]
})
const Course = mongoose.model('Course', courseSchema);


// رفع الصور
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'students/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// تسجيل المحاضر
app.post('/register', async (req, res) => {
  try{
    const { email, financialNumber, password } = req.body;
    const newLecturer = new Lecturer({ email, financialNumber, password: password.trim() });
    await newLecturer.save();
    res.json({ message: 'Lecturer registered successfully' });
  }catch(error){
    res.status(500).json({ message: error.message });
  }
});
// تسجيل الدخول
app.post('/login', async (req, res) => {
  try{
    const { financialNumber, password } = req.body;
    const lecturer = await Lecturer.findOne({ financialNumber });
    if (!lecturer) return res.status(400).json({ message: 'Lecturer not found' });
    
    const isMatch = (password === lecturer.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    
    const token = jwt.sign({ id: lecturer._id }, 'secret');
    res.json({ token, lecturer: lecturer._id });
  }catch(error){
    res.status(500).json({ message: error.message });
  }
});

// ارسال ايميلات تحذير
const { sendEmail } = require('./sendEmail');

app.post('/send-warning-email/:id', authMiddleware, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate(['instructor', 'students']);
    console.log(course);

    if (!course || course.instructor._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'المساق غير موجود / انت لست الدكتور' });
    }

    const studentAbsences = {}; 
    const student_absent_three_or_more = [];

    // Iterate through each session
    course.sessions.forEach((session) => {
      // Check each student in the course
      course.students.forEach((student) => {
        const isPresent = session.attendance.some((record) => record.student.toString() === student._id.toString());
        
        // If the student is not present, increment their absence count
        if (!isPresent) {
          studentAbsences[student._id] = (studentAbsences[student._id] || 0) + 1;

          // Add the student to the warning list if absent 3 or more times and not already added
          if (studentAbsences[student._id] >= 3 && !student_absent_three_or_more.includes(student)) {
            student_absent_three_or_more.push({ 
              student, 
              absenceCount: studentAbsences[student._id] 
            });
          }
        }
      });
    });

    // Send emails to students with 3 or more absences
    for (const { student, absenceCount } of student_absent_three_or_more) {
      await sendEmail(
        student.student_email,
        `Warning: Excessive Absences in ${course.course_name} - (${course.course_number})`,
        `
        <p>Dear ${student.student_name},</p>
        <p>This is a notification regarding your attendance in the course <strong>${course.course_name}</strong> (${course.course_number}).</p>
        <p>You have been absent <strong>${absenceCount}</strong> times, which exceeds the allowed limit.</p>
        <p>Please make sure to attend all future classes to avoid further action. If you have valid reasons for these absences, please reach out to your instructor:</p>
        <p>Best regards,</p>
        <p>Email: ${course.instructor.email}</p>
        `
      );
    }

    res.json({ message: 'Emails sent to students with 3 or more absences' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

// الطلاب
app.get('/get-students', authMiddleware, async (req, res) => {
  try {
    const students = await Student.find();
    students.sort((a, b) => {
      if (a.student_number < b.student_number) return -1;
      if (a.student_number > b.student_number) return 1;
      return 0;
    });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// حذف طالب من السستم
app.delete('/delete-student/:id', authMiddleware, async (req, res) => {
  try {
    // Find and delete the student
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Delete the student image file from the server
    fs.unlink(`students/${student.student_image}`, (err) => {
      if (err) {
        console.error('Error while deleting the file:', err);
      }
    });

    // Find all courses containing the student
    const courses = await Course.find({ students: req.params.id });

    // Update courses
    for (const course of courses) {
      // Remove the student from the course
      course.students.pull(req.params.id);

      // Filter attendance for the sessions
      course.sessions = course.sessions.map(session => {
        session.attendance = session.attendance.filter(attendance => attendance.student.toString() !== req.params.id);
        return session;
      });

      // Save the course document
      await course.save();
    }

    res.status(200).json({ message: 'Student and related data deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});
// حذف طالب من المساق
app.delete('/delete-student-from-course/:id', authMiddleware, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    const student_id = req.query.student_id;
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    // Remove the student from the course
    course.students.pull(student_id);
    // Filter attendance for the sessions
    course.sessions = course.sessions.map(session => {
      session.attendance = session.attendance.filter(attendance => attendance.student.toString() !== student_id);
      return session;
    });
    // Save the course document
    await course.save();
    res.status(200).json({ message: 'Student removed from course successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});
// اضافة طالب على السستم
app.post('/add-student', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const Number_exists = await Student.findOne({ student_number: req.body.student_number });
    const Email_exists = await Student.findOne({ student_email: req.body.student_email.toLowerCase() });
    if (Number_exists) {
      return res.status(400).json({ message: 'Student number already exists' });
    }
    if (Email_exists) {
      return res.status(400).json({ message: 'Student email already exists' });
    }
    
    const newStudent = new Student({
      student_image: `${req.file.filename}`,
      student_name: req.body.student_name,
      student_email: req.body.student_email,
      student_number: req.body.student_number
    });
    await newStudent.save();
    res.json(newStudent);
  } catch (error) {
    if (req.file && req.file.filename) {
      // Using the callback version of fs.unlink
      fs.unlink(`students/${req.file.filename}`, (err) => {
        if (err) {
          console.error('Error while deleting the file:', err);
        }
      });
    }
    res.status(500).json({ message: error.message });
  }
});

// اضافة مساق
app.post('/add-course', authMiddleware, async (req, res) => {
  try{
    const course = new Course({
      instructor: req.user.id,
      course_name: req.body.course_name,
      course_number: req.body.course_number,
      startAt: req.body.startAt,
      duration_in_minutes: req.body.duration_in_minutes,
      section_number: req.body.section_number,
      days: req.body.days,
    });
    await course.save();
    res.json(course);
  }catch(error){
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});
// حذف مساق
app.delete('/delete-course/:id', authMiddleware, async (req, res) => {
  try {
    // Find the course by ID
    const course = await Course.findById(req.params.id);
    // Check if the course exists
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    // Check if the instructor matches the authenticated user
    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to delete this course' });
    }
    // Delete the course
    await Course.deleteOne({ _id: course._id });
    // Send a success response
    res.status(200).json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});
// اضافة طالب للمساق
app.post('/add-students-to-course/:courseId', authMiddleware, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const studentIds = req.body.studentIds; // Expect an array of student IDs
    console.log(studentIds);
    
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of student IDs' });
    }

    // Fetch students from the database
    const students = await Student.find({ _id: { $in: studentIds } });

    if (students.length !== studentIds.length) {
      return res.status(404).json({ message: 'One or more students not found' });
    }

    // Filter out students that are already enrolled
    const newStudents = students.filter(student =>
      !course.students.some(enrolledStudent => enrolledStudent.equals(student._id))
    );

    if (newStudents.length === 0) {
      return res.status(400).json({ message: 'All students are already enrolled in this course' });
    }

    // Add new students to the course
    course.students.push(...newStudents.map(student => student._id));
    await course.save();

    res.json({ message: 'Students added to course successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});
// مساقاتي
app.get('/my-courses', authMiddleware, async (req, res) => {
  try{
    const courses = await Course.find({ instructor: req.user.id });
    res.json(courses);
  }catch(error){
    res.status(500).json({ message: error.message });
  }
});
// بروفايل مساق
app.get('/course/:id', authMiddleware, async (req, res) => {
  try{
    const course = await Course.findOne({_id: req.params.id, instructor: req.user.id }).populate('students');
    if(!course) return res.status(404).json({ message: 'Course not found' });
    // Sort students by student_number in ascending order
    course.students.sort((a, b) => {
      if (a.student_number < b.student_number) return -1;
      if (a.student_number > b.student_number) return 1;
      return 0;
    });
    
    res.json(course);
  }catch(error){
    res.status(500).json({ message: error.message });
  }
});
// احضار الطلبة الذين غير مسجلين بالمساق لصفحة اضافة طلاب للمساق
  app.get('/get-students-not-in-course/:courseId', authMiddleware, async (req, res) => {
    try{
      const course = await Course.findOne({_id: req.params.courseId, instructor: req.user.id});
      if(!course) return res.status(404).json({ message: 'Course not found' });
      const studentIds = course.students.map(student => student.toString());
      const studentsNotInCourse = await Student.find({ _id: { $nin: studentIds } });
      res.json(studentsNotInCourse);
    }catch(error){
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  });
// اخذ الحضور من الكاميرا بمحاضرة جديدة
app.post('/start-attendance/:courseId', authMiddleware, async (req, res) => {
  try{
    const courseId = req.params.courseId;
    const lecturer = await Lecturer.findById(req.user.id);
    // Fetch the course
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).send('Course not found.');
    if(course.instructor.toString() !== req.user.id) return res.status(403).send('You are not authorized to start attendance for this course.');

    const { minutes, attendanceCount } = req.body;
  
    if (
      !minutes ||
      (typeof minutes !== 'number' && typeof minutes !== 'string') ||
      (typeof minutes === 'string' && !/^\d+(:\d+)?$/.test(minutes))
    ) {
      throw new Error('Invalid minutes format. Expected a number (e.g., 90) or a time string (e.g., "0:15").');
    }

    // Convert input to total seconds
    let totalSeconds;
    if (typeof minutes === 'number') {
      totalSeconds = minutes * 60; // Numeric input (plain minutes)
    } else if (!minutes.includes(':')) {
      totalSeconds = parseFloat(minutes) * 60; // Plain string input (e.g., "90")
    } else {
      // Handle time strings like "0:15" (minutes:seconds)
      const [mins, secs] = minutes.split(':').map(Number);
      totalSeconds = mins * 60 + secs; // Convert minutes and seconds to total seconds
    }
    
    console.log(`Total Seconds for camera: ${totalSeconds}`);
    
    // Construct the command to run the Python script and pass the courseId as an argument
    const command = `python ./t1.py ${course._id} ${lecturer.email} ${totalSeconds} ${attendanceCount}`;
    // Run the Python script with the courseId
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return res.status(500).send(error);
      }
      if (stderr) {
        console.error(`Stderr: ${stderr}`);
        return res.status(500).send('Error occurred during attendance process.');
      }
      console.log(`Stdout:\n ${stdout}`);
      res.status(200).send('Attendance process started.');
    });
  }catch(error){
    console.log(error);
    res.status(500).json({ message: error.message });  
  }
});
// حذف محاضرة
app.delete('/session/:courseID/:sessionID', async (req, res) => {
  try{
    const {courseID, sessionID} = req.params
    const course = await Course.findById(courseID);
    if(!course) throw new Error('Course not found!');
    // Find the session and remove it
    const sessionIndex = course.sessions.findIndex(session => session._id.toString() === sessionID);
    if (sessionIndex === -1) {
      throw new Error('Session not found!');
    }
    // Remove the session
    course.sessions.splice(sessionIndex, 1);
    // Save the updated course
    await course.save();
    res.status(200).json({message: 'Session deleted successfully!'})
  }catch(error){
    console.log(error);
    res.status(500).json({message: error.message})
  }
})
// اضافة بصمة جديدة
app.post('/add-fingerprint', authMiddleware, async (req, res) => {
  try{
      const user_id = req.body.user_id;
      const name = req.body.name;
      const university_id = req.body.university_id;
      console.log(user_id, name, university_id);
      const command = `python ./newfinger.py ${user_id} "${name}" ${university_id}`;
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
        console.error(`Error executing script: ${stderr}`);
        return res.status(500).json({ message: 'Error running fingerprint script.' });
      }
      console.log(`Script output: ${stdout}`);
      res.json({ message: 'Fingerprint added successfully.'});
    });
  }catch(error){
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});
// تسجيل بصمات للحضور
app.post('/register-attendance/:courseId/:sessionId', authMiddleware, async (req, res) => {
  try{
    const courseId = req.params.courseId;
    const sessionId = req.params.sessionId;

    // Find the course and populate attendance.student in all sessions
    const course = await Course.findById(courseId).populate([
      {
        path: 'sessions.attendance.student', // Nested path for attendance.student
        select: '-password', // Exclude sensitive fields
      },
      {
        path: 'students', // Additional population for students
        select: '-password', // Exclude sensitive fields
      }
    ]);
    if (!course) return res.status(404).send('Course not found.');
    
    const session = course.sessions.find(session => session._id.toString() === sessionId);
    if (!session) return res.status(404).send('Session not found.');

    // Validate the request body for `minutes`
    const { minutes } = req.body;
  
    if (
      !minutes ||
      (typeof minutes !== 'number' && typeof minutes !== 'string') ||
      (typeof minutes === 'string' && !/^\d+(:\d+)?$/.test(minutes))
    ) {
      throw new Error('Invalid minutes format. Expected a number (e.g., 90) or a time string (e.g., "0:15").');
    }

  // Convert input to total seconds
  let totalSeconds;
  if (typeof minutes === 'number') {
    totalSeconds = minutes * 60; // Numeric input (plain minutes)
  } else if (!minutes.includes(':')) {
    totalSeconds = parseFloat(minutes) * 60; // Plain string input (e.g., "90")
  } else {
    // Handle time strings like "0:15" (minutes:seconds)
    const [mins, secs] = minutes.split(':').map(Number);
    totalSeconds = mins * 60 + secs; // Convert minutes and seconds to total seconds
  }
  
  console.log(`Total Seconds for fingerprint: ${totalSeconds}`);

    const command = `python ./send_fingers.py ${course._id} ${session._id} ${totalSeconds}`;
    // Run the Python script with the courseId
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return res.status(500).send(error);
      }
      if (stderr) {
        console.error(`Stderr: ${stderr}`);
        return res.status(500).send('Error occurred during attendance process.');
      }
      console.log(`Stdout:\n ${stdout}`);
      res.status(200).send({message: 'Attendance took successfully.' });
    });
  }catch(error){
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});
// جلب البصمات من البايثون وادخالهم على المحاضرة
app.post('/get-attendance-from-fingerprint/:courseId/:sessionId', async (req, res) => {
  try{
    const courseId = req.params.courseId;
    const sessionId = req.params.sessionId;
    console.log("Params from api: ", req.params);
    console.log("body:");
    console.log(req.body.fingerprint_data);
        
    // Find the course and populate attendance.student in all sessions
    const course = await Course.findById(courseId).populate([
      {
        path: 'sessions.attendance.student', // Nested path for attendance.student
        select: '-password', // Exclude sensitive fields
      },
      {
        path: 'students', // Additional population for students
        select: '-password', // Exclude sensitive fields
      }
    ]);
    if (!course) return res.status(404).send('Course not found.');
    
    const session = course.sessions.find(session => session._id.toString() === sessionId);
    if (!session) return res.status(404).send('Session not found.');

   if(req.body.fingerprint_data.length === 0) {
      return res.status(404).json({ message: 'No fingerprints data collected.' });
   }
   
   
   const students_from_fingerprint = [];
   const seen = new Set();

   // console.log(`Data read from Excel file :`);
   req.body.fingerprint_data.forEach(fingerprint => {
     if (!seen.has(fingerprint.studentid)) {
      students_from_fingerprint.push(fingerprint);
       seen.add(fingerprint.studentid);
     }
   });
   
   console.log("Students from fingerprint:  ");
   console.log(students_from_fingerprint);


   const sutdents_in_course = course.students.map(student => student); // Already populated students
   
   students_from_fingerprint.forEach(student_from_fingerprint => {
     
     // Check if the student exists in the populated students list
     const student_in_course = sutdents_in_course.find(
       student => student.student_number.toString() === student_from_fingerprint.studentid.toString()
     );
     // console.log("student_in_course: ", student_in_course);
     if (student_in_course) {
       console.log(student_in_course);
     
       // Check if the student is already in attendance
       const existingAttendance = session.attendance.find(att => att.student.student_number == student_in_course.student_number);
             console.log(existingAttendance);
             
       if (existingAttendance) {
         // If the student is already in attendance, increment attendance_count if it's less than attendance_max_count
         if (existingAttendance.attendance_count < session.attendance_max_count) {
           existingAttendance.attendance_count += 1;
           console.log(`Incremented attendance_count for student ${student_from_fingerprint.studentid}`);
         } else {
           console.log(`Attendance_count for student ${student_from_fingerprint.studentid} is already ${attendance_max_count}. No increment.`);
         }
       } else {
         // If the student is not in attendance, add them to the attendance array
         session.attendance.push({
           student: student_in_course._id,
           time_of_attendance: new Date(student_from_fingerprint.Time),
           attendance_count: 1
         });
         console.log(`Added student ${student_from_fingerprint.studentid} to attendance.`);
       }
     } else {
       console.log(`Student ${student_from_fingerprint.studentid} is not in the course.`);
     }
   });
   
  //  Save the session if it's a Mongoose document
   await course.save();

    res.status(200).json({ message: 'Attendance data retrieved successfully', session });
  }catch(error){
    console.log(error);
    res.status(500).json({ message: error.message });
  }
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});