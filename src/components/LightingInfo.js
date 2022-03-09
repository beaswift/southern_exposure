import React , { useState, useEffect }from 'react'
import { axiosClient } from "../api-common.js";
import { useQuery, useMutation } from "react-query";

const api_base_url = axiosClient.defaults.baseURL;

function LightingInfo() {
  const [displayState, setDisplayState] = useState("none")

function handleSubmit(e,lighting) {
    e.preventDefault();
    setDeletePreferenceID(lighting.lighting_preference_id);
    setDeleteLightingName(lighting.lighting_name);
    setPutLightingName(lighting.lighting_name);
    setPutLightingTimes(lighting.lighting_times);
    setPutLightingLength(lighting.lighting_length);
    setPutLightingGPIOPin(lighting.gpio_pin);
    setDisplayState("block");
  }

  function handleSubmitNew(e) {
    e.preventDefault();
    setDeletePreferenceID("");
    setPutLightingName("");
    setPutLightingTimes("");
    setPutLightingLength("");
    setPutLightingGPIOPin("");
    setDisplayState("block");
  }

  function handleCancelNewOrUpdate(e) {
    e.preventDefault();
    setDeletePreferenceID("")
    setPutLightingName("");
    setPutLightingTimes("");
    setPutLightingLength("");
    setPutLightingGPIOPin("");
    setDisplayState("none");
  }

  function deletionActual() {
    try {
      deleteLightingPreference();
      setDisplayState("none");
    } catch (err) {
      setDeleteLightingResult(formatResponse(err));
      console.log(deleteLightingResult);
      }
  }

  function deleteLighting() {
    if(deleteLightingName) {
      window.confirm("Are you sure you want to delete " + putLightingName + "?" ) && deletionActual();
    }
  }

    const { isLoading, error, data, refetch } = useQuery('fetchLighting', () =>
    axiosClient(api_base_url + "lighting_preferences"))

    const formatResponse = (res) => {
        return JSON.stringify(res, null, 2);
      };
    
    const [deletepreferenceID, setDeletePreferenceID] = useState("");
    const [deleteLightingName, setDeleteLightingName] = useState("");
    const [putLightingName, setPutLightingName] = useState("");
    const [putLightingTimes, setPutLightingTimes] = useState("");
    const [putLightingLength, setPutLightingLength] = useState("");
    const [putLightingGPIOPin, setPutLightingGPIOPin] = useState("");
    const [putLightingResult, setPutLightingResult] = useState(null);
    const [deleteLightingResult, setDeleteLightingResult] = useState("");  

    const { isLoading: isUpdatingLightingPreference, mutate: updateLightingPreference } = useMutation(
    async () => {

        return await axiosClient.put(api_base_url + "lighting_preferences/", {
        lighting_preference_id: deletepreferenceID,
        lighting_name: putLightingName,
        lighting_times: putLightingTimes,
        lighting_length: putLightingLength,
        gpio_pin: putLightingGPIOPin,
        });
    },
    {
        onSuccess: (res) => {
        const result = {
            status: res.status + "-" + res.statusText,
            headers: res.headers,
            data: res.data,
        };
        refetch();
        setPutLightingResult(formatResponse(result));
        console.log(putLightingResult)
        },
        onError: (err) => {
        setPutLightingResult(formatResponse(err.response?.data || err));
        refetch();
        },
      }
    );

    const { mutate: deleteLightingPreference } = useMutation(
      async () => {
        return await axiosClient.delete(api_base_url + "lighting_preferences/" + deleteLightingName);
      },
      {
        onSuccess: (res) => {
          const result = {
            status: res.status + "-" + res.statusText,
            headers: res.headers,
            data: res.data,
          };
          setDeleteLightingResult(formatResponse(result));
          refetch();
        },
        onError: (err) => {
          setDeleteLightingResult(formatResponse(err.response?.data || err));
          refetch();
        },
      }
    );

    useEffect(() => {
    if (isUpdatingLightingPreference) setPutLightingResult("updating...");
    }, [isUpdatingLightingPreference]);
    function putLightingData() {
    if (putLightingName) {
        try {
        updateLightingPreference();
        setDisplayState("none");
        } catch (err) {
        setPutLightingResult(formatResponse(err));
        }
    }
    }

  // useEffect(() => { 
  //     refetch();
  //   }, [deleteLightingResult, refetch]);


  // useEffect(() => { 
  //   refetch();
  // }, [putLightingResult, refetch]);

    return (
        <div>
        <div className="LightingInfo">
            
          <h1>Lighting Preferences</h1>
          {error && <div>Something went wrong ...</div>}
     
          {isLoading ? (
            <div>Retrieving Information ...</div>
          ) : (
           <div>{data.data.rows.map((lighting) => (<p key={lighting.lighting_preference_id.toString()}><a key={lighting.lighting_preference_id.toString()} href="/" onClick={e => handleSubmit(e,lighting) }>{lighting.lighting_name}</a></p>))} 
           </div>
         )}
         <p><b><a href="/" onClick={e => handleSubmitNew(e) }>Add New Lighting</a></b></p>
        </div>

        <div className="card-body"style={{display: displayState }}>    {/* // This will hide it, need to add matching </div> tag below where noted & need to conditionally set via setState on click handlers handleSubmit & handleSubmitNew & have the update button set it back to hidden  */}         
        <div className="card-header">Update Lighting Controls</div>  
        <div className="card-body">  
        <div className="form-group">
        <label>
              Name for Lighting:
              </label>
          <input
            type="text"
            value={putLightingName}
            onChange={(e) => setPutLightingName(e.target.value)}
            className="form-control"
            placeholder="Lighting Name"
          />
        </div>
        
        <div className="form-group">
        <label>
              Time to Turn on Lighting:
              </label>
          <input
            type="text"
            value={putLightingTimes}
            onChange={(e) => setPutLightingTimes(e.target.value)}
            className="form-control"
            placeholder="24hr format-Example: 0800 OR For Multiple: 0800,1500"
          />
        </div>
        <div className="form-group">
        <label>
              Length of Time for Lighting:
              </label>
          <input
            type="text"
            value={putLightingLength}
            onChange={(e) => setPutLightingLength(e.target.value)}
            className="form-control"
            placeholder="In Minutes. Example: 240 (would be 4 hours)"
          />
        </div>
        <div className="form-group">
        <label>
              GPIO Pin to Turn on Lighting:
              </label>
          <input
            type="text"
            value={putLightingGPIOPin}
            onChange={(e) => setPutLightingGPIOPin(e.target.value)}
            className="form-control"
            placeholder="GPIO Pin"
          />
        </div>
        <button className="btn btn-sm btn-primary" onClick={putLightingData}>
          Update Lighting Controls
        </button>
        </div>
        <div className="card-body">
        <button
          className="btn btn-sm btn-warning ml-2"
          onClick={handleCancelNewOrUpdate}
        >
          Cancel
        </button>
        <br /> 
        <br />
        {putLightingName && <div><button
          className="btn btn-sm btn-warning ml-2"
          onClick={deleteLighting}
        >
          Delete Lighting
        </button></div>}
        </div>

        </div> 

        </div>
        
      );
    }

export default LightingInfo