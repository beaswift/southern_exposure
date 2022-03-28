import React , { useState, useEffect }from 'react'
import { Line } from 'react-chartjs-2';
import { axiosClient } from "../api-common.js";
import { useQuery, useMutation } from "react-query";
import { Chart, registerables } from 'chart.js';



Chart.register(...registerables);

const api_base_url = axiosClient.defaults.baseURL;

function ReadingsChart(props) {

    const [isLoading, setLoading] = useState(false);
    const [isError, setError] = useState(false);
    const [data, setData] = useState({});

    const [datesForReadings, setDatesForReadings] = useState([]);
    const [readingHighs, setReadingHighs] = useState([]);
    const [readingLows, setReadingLows] = useState([]);
    const [readingAverages, setReadingAverages] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
          setError(false);
          setLoading(true);
          try {
            const response = await axiosClient(api_base_url + "past_readings/" + props.pastReadingsZone);
            setData(response.data);
          } catch (error) {
            setError(true);
          }
          setLoading(false);
        };
        fetchData()
      }, [props.pastReadingsZone]);
 
    useEffect(() => {
        if(typeof data.rows !== "undefined")
    {
      const arrayForDates = [];
      const arrayForHighs = [];
      const arrayForLows = [];
      const arrayForAverages = [];
      
      data.rows.forEach(element => arrayForDates.push(element.date));
      data.rows.forEach(element => arrayForHighs.push(element.daily_high));
      data.rows.forEach(element => arrayForLows.push(element.daily_low));
      data.rows.forEach(element => arrayForAverages.push(element.daily_average));
      
      const reversedArrayForDates = arrayForDates.reverse(); 
      const reversedArrayForHighs = arrayForHighs.reverse();
      const reversedArrayForLows = arrayForLows.reverse();
      const reversedArrayForAverages = arrayForAverages.reverse();

      setDatesForReadings(reversedArrayForDates);
      setReadingHighs(reversedArrayForHighs);
      setReadingLows(reversedArrayForLows);
      setReadingAverages(reversedArrayForAverages);
      }
    }, [data]);
    
    const dataForChart = {
        labels: datesForReadings,
        datasets: [
            {
              label: 'Daily Lows',
              data: readingLows,
              borderColor: 'rgba(255, 0, 0, 1)',
              backgroundColor: 'rgba(255, 0, 0, .6)',
              pointBackgroundColor: 'rgba(255, 0, 0, 1)',
              pointBorderColor: 'rgba(255, 0, 0, 1)',
              fill: true,
              fillOpacity: .2
          },
          {
            label: 'Daily Averages',
            data: readingAverages,
            borderColor: 'rgba(0, 128, 0, 1)',
            backgroundColor: 'rgba(0, 128, 0, .6)',
            pointBackgroundColor: 'rgba(0, 128, 0, 1)',
            pointBorderColor: 'rgba(0, 128, 0, 1)',
            fill: true,
            fillOpacity: .2
        },            
        {
          label: 'Daily Highs',
          data: readingHighs,
          borderColor: 'rgba(0, 0, 128, 1)',
          backgroundColor: 'rgba(0, 0, 128, .6)',
          pointBackgroundColor: 'rgba(0, 0, 128, 1)',
          pointBorderColor: 'rgba(0, 0, 128, 1)',
          fill: true,
          fillOpacity: .2
      }
        ]
    }

    const options = {
      title: {
        display: true,
        text: 'Daily Moisture Readings'
      }
    }
    
    return (  
<div>  
    {isError && <div>Something went wrong ...</div>}
 {isLoading ? (
   <div>Loading ...</div>
 ) : (
  <Line data={dataForChart} options={options} />
 )}
</div>

    );
}

export default ReadingsChart