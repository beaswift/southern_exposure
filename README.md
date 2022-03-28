# Southern Exposure

Southern Exposure is an automated software for managing the watering and lighting of plants - both indoors and outdoors.  Utitlizing REACT.js, Node.js, Express and Python the software allows someone to utilize a Raspberry Pi to set up zones for varied watering and lighting schedules and settings for different sections of a garden, greenhouse, or vertical garden.  

With this application you are able to
- Create scheduled waterings for multiple zones
- Create scheduled lighting for multiple zones
- Water a zone immediately via a browser window
- Water an area based on minimum moisture levels
- View the time that an area was last watered
- View data for past moisture levels for each zone of a garden


![GroundskeeperSoftware_resized](https://user-images.githubusercontent.com/30629717/160464091-c2859f13-dc74-4eec-87be-277f57043ff4.jpg)


## Background

In the spring of 2021 I became acquainted with the owner of a local farm who works with the raising of native plants in central Illinois. I was quite fascinated with their work.  Upon finding out that they were maintaining their greenhouses by hand I approached them about their automation needs and we developed a professional relationship in order to implement software to manage the irrigation of their greenhouses.  We initialliy utilized a forked version of [Automated Irrigation System](https://github.com/PatrickHallek/automated-irrigation-system).  The software required some minor changes in order to use a relay to control several 12 volt valves. While that software was able to handle the moisture sensor data quite well, the watering schedules were entirely handled by JavaScript triggered by moisture levels.  The owner of the farm prefered to be able to schedule their irrigation based on the time of day and needed the irrigation to be able to happen synchronously in multiple areas.  For these reasons I decided to develop a new software from the ground up.
