import React , { useState, useEffect }from 'react'
import { axiosClient } from "../api-common.js";
import { useQuery, useMutation } from "react-query";
const api_base_url = axiosClient.defaults.baseURL;

//const response = await axiosClient.get(api_base_url + "zones");




function AddZone() {

    const formatResponse = (res) => {
        return JSON.stringify(res, null, 2);
        };

    const { isLoading, error, data, refetch } = useQuery('fetchZones', () =>
        axiosClient(api_base_url + "zones"))

    const [putSensorName, setPutSensorName] = useState("");
    const [putIrrigationTriggerByMoisture, setPutIrrigationTriggerByMoisture] = useState("");
    const [putMinimumMoisture, setPutMinimumMoisture] = useState("");
    const [putIrrigationInterval, setPutIrrigationInterval] = useState("");
    const [putIrrigationLength, setPutIrrigationLength] = useState("");    
    const [putIrrigationTime, setPutIrrigationTime] = useState("");
    const [putZoneGPIOPin, setPutZoneGPIOPin] = useState("");
    const [putZoneResult, setPutZoneResult] = useState(null);
    const [checked, setChecked] = useState(false);

    const handleChange = () => {
    setChecked(!checked);
    };

    const { isLoading: isUpdatingZonePreference, mutate: updateZonePreference, } = useMutation(
        async () => {
        return await axiosClient.put(api_base_url + "zones/", {
            sensor_name: putSensorName,
            minimum_moisture: putMinimumMoisture,
            irrigation_trigger_by_moisture: putIrrigationTriggerByMoisture,
            irrigation_length: putIrrigationLength,
            irrigation_interval: putIrrigationInterval,
            irrigation_time: putIrrigationTime,
            gpio_pin: putZoneGPIOPin,     
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
            handleClear();
            refetch();
        },
        onError: (err) => {
            setPutZoneResult(formatResponse(err.response?.data || err));
            console.log(formatResponse(err.response?.data || err))
            console.log(putZoneResult)
        },
        }
    );

    useEffect(() => {
    if (checked === false) {
    setPutIrrigationTriggerByMoisture(0);
    } else {
    setPutIrrigationTriggerByMoisture(1);
    }
     }, [checked]);

    useEffect(() => {
        if (isUpdatingZonePreference) setPutZoneResult("updating...");
        }, [isUpdatingZonePreference]);
    function putSensorData() {
        if (putSensorName) {
            try {
            updateZonePreference();
            refetch();
            } catch (err) {
            setPutZoneResult(formatResponse(err));
            }
        }
    }

    function handleCancelNewOrUpdate(e) {
        e.preventDefault();
        setPutSensorName("");
        setChecked(false);
        setPutMinimumMoisture("");
        setPutIrrigationTriggerByMoisture("");
        setPutIrrigationInterval("");
        setPutIrrigationLength("");
        setPutIrrigationTime("");
        setPutZoneGPIOPin("");
        window.location.href = '/';
        }

    function handleClear() {
        setPutSensorName("");
        setChecked(false);
        setPutMinimumMoisture("");
        setPutIrrigationTriggerByMoisture("");
        setPutIrrigationInterval("");
        setPutIrrigationLength("");
        setPutIrrigationTime("");
        setPutZoneGPIOPin("");
        }
 
      useEffect(() => {
        if (isUpdatingZonePreference) setPutZoneResult("updating...");
      }, [isUpdatingZonePreference]);
      

    return (
        <div className="AddZome">
            
          <h3>Current Zones</h3>
          {error && <div>Something went wrong ...</div>}
     
          {isLoading ? (
            <div>Retrieving Information ...</div>
          ) : (
            <pre>{data.data.rows.map((sensor, index) => (<div key={sensor.zone_preference_id.toString()}>{sensor.sensor_name}</div>))}
            </pre>
          )}


        <div >
        <h1>Create New Zone</h1>  
            <div className="card-body">  
            <div className="form-group">
                <input
                type="text"
                value={putSensorName}       
                onChange={(e) => setPutSensorName(e.target.value)}
                className="form-control"
                placeholder="Sensor/Zone Name (required)"
                required={true}
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
            onClick={handleCancelNewOrUpdate}
            >
            Cancel
            </button>
        </div>
            
            </div>
      );
    }

export default AddZone