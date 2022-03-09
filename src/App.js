import logo from './logo.svg';
import './App.css';
import React, { useState} from "react";
import 'bootstrap/dist/css/bootstrap.min.css'
import { Navbar, NavDropdown, Nav, Container } from 'react-bootstrap';
//import Navigation from "./components/Navigation";
import BasicInfo from "./components/BasicInfo";
import ZoneInfo from "./components/ZoneInfo";
import AddZone from "./components/AddZone";
import LightingInfo from "./components/LightingInfo";
import { axiosClient } from "./api-common.js";
import { useQuery } from "react-query";

const api_base_url = axiosClient.defaults.baseURL


//import Navigation from "./components/Navigation";

//import { useQuery, useMutation } from "react-query";
//mport { axiosClient } from "./api-common.js";

//const api_base_url = axiosClient.defaults.baseURL
//import { Button, Navbar, NavDropdown, Nav, Container } from 'react-bootstrap'
//import Navbar from 'react-bootstrap/Navbar'


function App(props) {
  const { isLoading, error, data, refetch } = useQuery('fetchZones', () =>
axiosClient(api_base_url + "zones"));

  const [zoneInView, setZoneInView] = useState("");
  
  const [visibleComponent, setVisibleComponent] = useState("basicInfo");

  setInterval(refetch, 10000);
  

  return (
    <div>
  <Navbar bg="light" expand="lg">
    <Container>
      <Navbar.Brand>Groundskeeper Murphy</Navbar.Brand>
      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse id="basic-navbar-nav">
        <Nav className="me-auto">
          <Nav.Link  onClick={() => setVisibleComponent("basicInfo") }>Overview</Nav.Link>
          <Nav.Link onClick={() => setVisibleComponent("lightingInfo") }>Lighting</Nav.Link>
          <NavDropdown title="Zones" id="basic-nav-dropdown">
          {error && <div>Something went wrong ...</div>}
     
          {isLoading ? (
            <div>Retrieving Information ...</div>
          ) : (
            <div>{data.data.rows.map((sensor, index) => ( <NavDropdown.Item key={sensor.zone_preference_id.toString()} onClick={() => [setZoneInView(sensor.zone_preference_id), setVisibleComponent("zoneInfo")] }>{sensor.sensor_name}</NavDropdown.Item>))}</div>
          )}
          <NavDropdown.Divider />
          <NavDropdown.Item onClick={() => setVisibleComponent("addZone") } >Add Zone</NavDropdown.Item>
          </NavDropdown>
        </Nav>
      </Navbar.Collapse>
    </Container>
    </Navbar>   

      <div className="App"> 
       {visibleComponent === "basicInfo" && <BasicInfo />}
       {visibleComponent === "zoneInfo" && <ZoneInfo zoneToDisplay={zoneInView} key={zoneInView.toString()} />}
       {visibleComponent === "lightingInfo" && <LightingInfo />}
       {visibleComponent === "addZone" && <AddZone />}
       </div>
      
    </div>
  );
};

export default App;


