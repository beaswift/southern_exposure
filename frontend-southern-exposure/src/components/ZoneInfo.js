import React , { useState, useEffect }from 'react'
import { axiosClient } from "../api-common.js";
import { useQuery, useMutation } from "react-query";
import FormValidation from "./FormValidation";
import ReadingsChart from './ReadingsChart'

const api_base_url = axiosClient.defaults.baseURL;

function ZoneInfo(props) {
  const [displayStateCurrentSettings, setDisplayStateCurrentSettings] = useState('block');
  const [displayStateUpdates, setDisplayStateUpdates] = useState('none');
  const [moistureControlSetting, setMoistureControlSetting] = useState("Unknown");
  const [deleteSensorName, setDeleteSensorName] = useState("");
  //const [deletePreferenceID, setDeletePreferenceID] = useState("");
  const [putSensorName, setPutSensorName] = useState("");
  const [putIrrigationTriggerByMoisture, setPutIrrigationTriggerByMoisture] = useState(false);
  const [putMinimumMoisture, setPutMinimumMoisture] = useState(180);
  const [putIrrigationInterval, setPutIrrigationInterval] = useState(0);
  const [putIrrigationLength, setPutIrrigationLength] = useState(0);    
  const [putIrrigationTime, setPutIrrigationTime] = useState("");
  const [putZoneGPIOPin, setPutZoneGPIOPin] = useState("");
  const [putZoneResult, setPutZoneResult] = useState(null);
  const [deleteZoneResult, setDeleteZoneResult] = useState(null);  
  const [checked, setChecked] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  const formatResponse = (res) => {
    return JSON.stringify(res, null, 2);
  };

  const handleChange = () => {
    setChecked(!checked);
  };

  const { isLoading, error, data, refetch} = useQuery('fetchZone', () =>
  axiosClient(api_base_url + "zone/" + props.zoneToDisplay));


  const { isLoading: isUpdatingZonePreference, mutate: updateZonePreference } = useMutation(
    async () => {
      return await axiosClient.put(api_base_url + "zones/", {      
        sensor_name: putSensorName,
        minimum_moisture: putMinimumMoisture,
        irrigation_trigger_by_moisture: putIrrigationTriggerByMoisture,
        irrigation_length: Math.round(putIrrigationLength),
        irrigation_interval: putIrrigationInterval,
        irrigation_time: putIrrigationTime,
        gpio_pin: putZoneGPIOPin     
      });
    },
    {
      onSuccess: (res) => {
        const result = {
          status: res.status + "-" + res.statusText,
          headers: res.headers,
          data: res.data,
        };
        setPutZoneResult(formatResponse(result));
      },
      onError: (err) => {
        setPutZoneResult(formatResponse(err.response?.data || err));
      },
    }
  );

  const { mutate: deleteZonePreference } = useMutation(
    async () => {
      return await axiosClient.delete(api_base_url + "zone/" + deleteSensorName);
    },
    {
      onSuccess: (res) => {
        const result = {
          status: res.status + "-" + res.statusText,
          headers: res.headers,
          data: res.data,
        };
        setDeleteZoneResult(formatResponse(result));
      },
      onError: (err) => {
        setDeleteZoneResult(formatResponse(err.response?.data || err));
      },
    }
  );

  
  
  const { mutate: updateImmediateJobs, } = useMutation(
    async () => {
      return await axiosClient.put(api_base_url + "immediate_jobs/", {    
        sensor_name: putSensorName,  
        job_length: Math.round(putIrrigationLength),
        job_gpio_pin: putZoneGPIOPin,
        job_done: 0,     
      });
    },
    {
      onSuccess: (res) => {
        setTimeout(() => {  refetch() }, 1500 * putIrrigationLength );
        const result = {
          status: res.status + "-" + res.statusText,
          headers: res.headers,
          data: res.data,
        };
        console.log(result)
      },
      onError: (err) => {
        console.log("Error Watering "+putZoneGPIOPin)
      },
    }
  );

  useEffect(() => {
    if (isUpdatingZonePreference) setPutZoneResult("updating...");
  }, [isUpdatingZonePreference]);

function validate_string_of_list() {
  let list_of_values = putIrrigationTime.split(',');
 if ((list_of_values.every( x => !isNaN(x)) && (list_of_values.every( x => x.length === 4) ))){
   return true;
 }
 else if ( putIrrigationTime === "" ){
   return true;
 }
 else {
  return false;
 }
}

  function putSensorData() {
    if ((putSensorName) && (!isNaN(putZoneGPIOPin) && (validate_string_of_list()))) {
      try {
        updateZonePreference();
        changeDisplay();
        setShowWarning(false);
      } catch (err) {
        setPutZoneResult(formatResponse(err));
      }
     } else {
      setShowWarning(true);
     }
    } 
 

  function deletionActual() {
    try {
      console.log('Trying to delete ' + putSensorName );
      deleteZonePreference();
      refetch();
      window.location.href = '/';
    } catch (err) {
      setDeleteZoneResult(formatResponse(err));
      console.log(deleteZoneResult);
      window.location.href = '/';
      refetch();
      }
  }

  function deleteZone() {
    if(deleteSensorName) {
      window.confirm("Are you sure you want to delete " + putSensorName + "? \n\nIf this Zone was created automatically by a sensor you have set up,\nit will reappear if that sensor is still active." ) && deletionActual();
    }
  }
   
  useEffect(() => { 
    refetch();
  }, [props.zoneToDisplay, deleteZoneResult, refetch]);

   
  useEffect(() => {
    if (checked === false) {
      setPutIrrigationTriggerByMoisture(0);
    } else {
      setPutIrrigationTriggerByMoisture(1);
    }
  }, [checked]);

  useEffect(() => { 
    refetch();
  }, [putZoneResult, refetch]);

  useEffect(() => {
        if(typeof data !== "undefined")
    {
      //setDeletePreferenceID(data.data.rows.zone_preference_id);
      setDeleteSensorName(data.data.rows.sensor_name);
      setPutSensorName(data.data.rows.sensor_name);
      setPutMinimumMoisture(data.data.rows.minimum_moisture);
      setPutIrrigationTriggerByMoisture(data.data.rows.irrigation_trigger_by_moisture);
      setPutIrrigationInterval(data.data.rows.irrigation_interval);
      setPutIrrigationLength(data.data.rows.irrigation_length);
      setPutIrrigationTime(data.data.rows.irrigation_time);
      setPutZoneGPIOPin(data.data.rows.gpio_pin);
      if (data.data.rows.irrigation_trigger_by_moisture === 0)
      {setMoistureControlSetting("OFF");
      setChecked(false);
      }else
      {setMoistureControlSetting("ON");
      setChecked(true);
      }
    }
  }, [data]);

  useEffect(() => {
    if (isUpdatingZonePreference) setPutZoneResult("updating...");
  }, [isUpdatingZonePreference]);
  
  
  function handleCancelNewOrUpdateZone(e) {
    e.preventDefault();
    setPutMinimumMoisture(data.data.rows.minimum_moisture);
    setPutIrrigationTriggerByMoisture(data.data.rows.irrigation_trigger_by_moisture);
    setPutIrrigationInterval(data.data.rows.irrigation_interval);
    setPutIrrigationLength(data.data.rows.irrigation_length);
    setPutIrrigationTime(data.data.rows.irrigation_time);
    setPutZoneGPIOPin(data.data.rows.gpio_pin);
    changeDisplay();
    if (data.data.rows.irrigation_trigger_by_moisture === 0)
    {setMoistureControlSetting("OFF");
    setChecked(false);
    }else
    {setMoistureControlSetting("ON");
    setChecked(true);
    }
  }


  function changeDisplay() {
    if (displayStateCurrentSettings === "block"){
      setDisplayStateCurrentSettings("none");
      setDisplayStateUpdates("block");
    }
    else {
      setDisplayStateCurrentSettings("block");
      setDisplayStateUpdates("none");
    }
  }
  
  return (
    <div>
      <div style={{display: displayStateCurrentSettings }}>
      <h1>Current Settings for Zone</h1>
          
          {error && <div>Something went wrong ...</div>}
          {isLoading ? (
            <div>Retrieving Zone Data & Info ...</div>
          ) : (
            <div><p>Sensor: {data.data.rows.sensor_name}</p>
            <p>Irrigation Triggered by Moisture Reading: {moistureControlSetting}</p>
            <p>Minimum Moisture Reading Allowed Before Irrigation: {data.data.rows.minimum_moisture}</p>
            <p>Length of Irrigation (in seconds): {data.data.rows.irrigation_length}</p>
            <p>Minimum Time Interval Between Irrigation Triggered by Moisture Reading (in minutes): {data.data.rows.irrigation_interval}</p>
            <p>Irrigation time of Day: {data.data.rows.irrigation_time}</p>
            <p>GPIO Pin: {data.data.rows.gpio_pin}</p>
            <p>Last Watering: {String(data.data.rows.last_watering)}</p></div>
          )}
        <div>
        <button
          className="btn btn-sm btn-warning ml-2"
          onClick={updateImmediateJobs}
        >
          Water Now
        </button>
        </div>
        <br />
        <br />
        <br />


          <div>
          <button className="btn btn-sm btn-primary" onClick={changeDisplay}>
            Update Zone Settings
          </button>
          </div>
          <br />
          <div className='chart'>
          <ReadingsChart pastReadingsZone={putSensorName} key={putSensorName}/>
          </div>
          <br />

          <button className="btn btn-sm btn-primary" onClick={deleteZone}>
          
            Delete Zone
          </button>

    </div>
    <div style={{display: displayStateUpdates }}>
      <h2>Update Zone Control Settings</h2>  
      {showWarning === true && <FormValidation />}
          <div className="card-body">  
          <div className="form-group">
            <input
              type="text"
              value={putSensorName}       
              disabled={true}
              //onChange={(e) => setPutSensorName(e.target.value)}
              className="form-control"
              placeholder="Sensor/Zone Name"
            />
          </div>
          
          <div>
          <label>
              Set Irrigation By Moisture:
              </label>
              <input
                //name="setIrrigationByMoisture"
                type="checkbox"
                checked={checked}
                onChange={handleChange}
                />
          </div>

          <div className="form-group">
          <label>
              Minimum Moisture to Trigger Irrigation:
              </label>
              <input
                type="text"
                value={putMinimumMoisture}
                onChange={(e) => setPutMinimumMoisture(e.target.value)}
                className="form-control"
                placeholder="Minimum Moisture Value"
              />
            </div>
    
            <div className="form-group">
            <label>
              Length of Irrigation in Seconds:
              </label>
              <input
                type="text"
                value={putIrrigationLength}
                onChange={(e) => setPutIrrigationLength(e.target.value)}
                className="form-control"
                placeholder="example: 30"
              />
            </div>
            
          <div className="form-group">
          <label>
              Interval Between Irrigations in Minutes (if triggered by moisture):
              </label>
            <input
              type="text"
              value={putIrrigationInterval}
              onChange={(e) => setPutIrrigationInterval(e.target.value)}
              className="form-control"
              placeholder="In Minutes. Example: 240 (would be 4 hours)"
            />
          </div>
          <div className="form-group">
          <label>
              Irrigation Time of Day:
              </label>
              <input
                type="text"
                value={putIrrigationTime}
                onChange={(e) => setPutIrrigationTime(e.target.value)}
                className="form-control"
                placeholder="24hr format-Example: 0800 *OR* For Multiple: 0800,1500"
              />
          </div>
    
          <div className="form-group">
          <label>
              GPIO Pin to Turn on Watering:
              </label>
            <input
              type="text"
              value={putZoneGPIOPin}
              onChange={(e) => setPutZoneGPIOPin(e.target.value)}
              className="form-control"
              placeholder="GPIO Pin"
            />
          </div>
          <button className="btn btn-sm btn-primary" onClick={putSensorData}>
            Save Update
          </button>
          </div>

          <button
          className="btn btn-sm btn-warning ml-2"
          onClick={handleCancelNewOrUpdateZone}
        >
          Cancel
        </button>

    </div>
  
  </div>

  );
  }
  
  export default ZoneInfo