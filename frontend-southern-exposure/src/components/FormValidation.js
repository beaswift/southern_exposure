import React from 'react'
import Alert from 'react-bootstrap/Alert';


    function FormValidation() {
      return (
        <Alert dismissible variant="danger">
          <Alert.Heading>Something went wrong ..</Alert.Heading>
          <div>Your settings could not be saved.</div>
           <div><p><b>Please make sure that</b></p>
                <p><b>Your setting has a name</b></p>
                <p>Your <b>GPIO Pin</b> setting has a gpio pin number or is empty</p>
                <p>The <b>Time of Day</b> for your setting<br></br>
                    must be at least 4 numbers long 24 time format-<br></br>
                    comma separated for multiple times a day.<br></br>
                    0800 <i>for 8 am or </i><br></br>
                    0800,1300 <i>for 8 am and 1 pm</i><br></br>
                </p>
                <p>If you're unsure of what to do, hit cancel at the bottom of this page and return later when you have the new settings information.</p>
           </div>
        </Alert>
      )
    }

export default FormValidation