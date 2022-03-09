//lighting_preference_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,\
// lighting_name NVARCHAR(40)  NOT NULL,\
// lighting_times NVARCHAR(10)  NOT NULL,\
// gpio_pin INTEGER  NOT NULL\
//LightingPreference

//const [putId, setPutId] = useState("");
const [putLightingName, setPutLightingName] = useState("");
const [putLightingTimes, setPutLightingTimes] = useState("");
const [putGPIOPin, setPutGPIOPin] = useState("");
const [putResult, setPutResult] = useState(null);
const fortmatResponse = (res) => {
  return JSON.stringify(res, null, 2);
};
const { isLoading: isUpdatingLightingPreference, mutate: updateLightingPreference } = useMutation(
  async () => {
    return await apiClient.put(`/lighting_preferences/`, {
      lighting_name: putLightingName,
      lighting_times: putLightingTimes,
      gpio_pin: putGPIOPin,
    });
  },
  {
    onSuccess: (res) => {
      const result = {
        status: res.status + "-" + res.statusText,
        headers: res.headers,
        data: res.data,
      };
      setPutResult(fortmatResponse(result));
    },
    onError: (err) => {
      setPutResult(fortmatResponse(err.response?.data || err));
    },
  }
);
useEffect(() => {
  if (isUpdatingLightingPreference) setPutResult("updating...");
}, [isUpdatingLightingPreference]);
function putData() {
  if (putId) {
    try {
      updateLightingPreference();
    } catch (err) {
      setPutResult(fortmatResponse(err));
    }
  }
}
const clearPutOutput = () => {
  setPutResult(null);
};
return (
  <div id="app" className="container">
    <div className="card">
      <div className="card-header">React Query Axios PUT - BezKoder.com</div>
      
      <div className="card-body">  
        <div className="form-group">
          <input
            type="text"
            value={putLightingName}
            onChange={(e) => setPutLightingName(e.target.value)}
            className="form-control"
            placeholder="Lighting Name"
          />
        </div>
        <div className="form-group">
          <input
            type="text"
            value={putLightingTimes}
            onChange={(e) => setPutLightingTimes(e.target.value)}
            className="form-control"
            placeholder="Lighting Times"
          />
        </div>
        <div className="form-group">
          <input
            type="text"
            value={putGPIOPin}
            onChange={(e) => setPutGPIOPin(e.target.value)}
            className="form-control"
            placeholder="Lighting Name"
          />
        </div>
        <button className="btn btn-sm btn-primary" onClick={putData}>
          Update Data
        </button>
        <button
          className="btn btn-sm btn-warning ml-2"
          onClick={clearPutOutput}
        >
          Clear
        </button>
        {putResult && (
          <div className="alert alert-secondary mt-2" role="alert">
            <pre>{putResult}</pre>
          </div>
        )}
      </div>
    </div>
  </div>
);