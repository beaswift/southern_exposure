import React from 'react'
import { axiosClient } from "../api-common.js";
import { useQuery } from "react-query";
const api_base_url = axiosClient.defaults.baseURL;

//const response = await axiosClient.get(api_base_url + "zones");




function BasicInfo() {

    const { isLoading, error, data } = useQuery('fetchZones', () =>
    axiosClient(api_base_url + "zones"))

    return (
        <div className="BasicInfo">
            
          <h1>System Overview</h1>
          {error && <div>Something went wrong ...</div>}
     
          {isLoading ? (
            <div>Retrieving Information ...</div>
          ) : (
            <pre>{data.data.rows.map((sensor, index) => (<div key={sensor.zone_preference_id.toString()}>{sensor.sensor_name}</div>))}
            </pre>
          )}
        </div>
      );
    }

export default BasicInfo