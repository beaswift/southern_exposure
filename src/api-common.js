import axios from "axios";
export const axiosClient = axios.create({
    baseURL: "http://10.0.10.227:8000/",
    headers: {
      "Content-type": "application/json"
    }
  });
