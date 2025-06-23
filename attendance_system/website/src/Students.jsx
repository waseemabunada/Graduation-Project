import React from 'react'
import axios from 'axios'

const Students = () => {

    const [students, setStudents] = React.useState([])

    React.useEffect(() => {
        axios.get('http://localhost:8000/get-students', {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
            },
        })
        .then(res => {
            console.log(res.data);
            setStudents(res.data)
        })
        .catch(err => console.log(err))
    }, [])
    
    const deleteStudent = (id) => {
        const isConfirm = window.confirm('Are you sure you want to delete this student?')
        if(!isConfirm) return;
        axios.delete(`http://localhost:8000/delete-student/${id}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json',
            },
        })
       .then(res => {
         console.log(res.data);
         alert('Student deleted successfully');
         setStudents(students.filter(student => student._id!== id))
        })
       .catch(err => console.log(err))
    }

    return (
        <div className='max-width py-4'>
            {students?.length > 0 ? ( <>
                <h1>Students on system ({students.length})</h1>
                <table className='table'>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Number</th>
                            <th>Image</th>
                            <th>Control</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map(student => (
                            <tr key={student._id}>
                                <td>
                                <p>{student.student_name}</p>
                                <p className='mb-0'>{student.student_email}</p>
                                </td>
                                <td>{student.student_number}</td>
                                <td><img src={`http://localhost:8000/students/${student.student_image}`} alt={student.student_number} /></td>
                                <td><button className='btn btn-danger' onClick={() => deleteStudent(student._id)}>Delete student</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </>
            ) : (
                <h2 className='text-danger'>No Students Found</h2>
            )}
        </div>
    )
}

export default Students