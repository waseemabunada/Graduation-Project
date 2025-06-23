import React from 'react'

const Notfound = () => {
  return (
    <div className='max-width py-5'>
        <h1 className='text-center'>Page Not Found</h1>
        <p className='text-center'>The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.</p>
        <p className='text-center'><a href="/">Back to main page</a></p>
    </div>
  )
}

export default Notfound