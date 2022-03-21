const sqlite3 = require('sqlite3');
const express = require("express");
const app = express();
app.use(express.json());

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', 'http://10.0.10.227:3000');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);

    next();
});

const schedule = require('node-schedule');
const rpio = require('rpio');


const HTTP_PORT = 8000

const db = new sqlite3.Database('./southern_exposure_database.db', (err) => {
    if (err) {
        console.error("Error opening database " + err.message);
    } else {

        db.run('CREATE TABLE IF NOT EXISTS zone_preferences( \
            zone_preference_id INTEGER PRIMARY KEY NOT NULL,\
            sensor_name NVARCHAR(40),\
            irrigation_trigger_by_moisture INTEGER NOT NULL,\
            minimum_moisture INTEGER,\
            irrigation_length INTEGER,\
            irrigation_interval INTEGER,\
            irrigation_time NVARCHAR(80),\
            gpio_pin INTEGER,\
            last_watering TIMESTAMP NVARCHAR(20),\
            UNIQUE(sensor_name)\
        )', (err) => {
            if (err) {
                console.log("Table zone_preferences already exists.");
            }
        });

        db.run('CREATE TABLE IF NOT EXISTS lighting_preferences( \
            lighting_preference_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,\
            lighting_name NVARCHAR(40)  NOT NULL,\
            lighting_times NVARCHAR(80)  NOT NULL,\
            lighting_length INTEGER,\
            gpio_pin INTEGER NOT NULL,\
            UNIQUE(lighting_name)\
        )', (err) => {
            if (err) {
                console.log("Table lighting_preferences already exists.");
            }
        });

        db.run('CREATE TABLE IF NOT EXISTS readings( \
            reading_id INTEGER PRIMARY KEY NOT NULL,\
            sensor_name NVARCHAR(20) NOT NULL,\
            capacity INTEGER NOT NULL,\
            time TIMESTAMP NVARCHAR(20) NOT NULL\
        )', (err) => {
            if (err) {
                console.log("Table readings already exists.");
            } 
        });

        db.run('CREATE TABLE IF NOT EXISTS jobs( \
            job_id INTEGER PRIMARY KEY NOT NULL,\
            job_name_type NVARCHAR(61) NOT NULL,\
            job_time_of_day NVARCHAR(80),\
            job_length INTEGER,\
            job_gpio_pin INTEGER,\
            last_job_time TIMESTAMP NVARCHAR(20),\
            UNIQUE(job_name_type)\
        )', (err) => {
            if (err) {
                console.log(err);
                console.log("Table jobs already exists.");
            } 
        });

        db.run('CREATE TABLE IF NOT EXISTS immediate_jobs( \
            job_id INTEGER PRIMARY KEY NOT NULL,\
            sensor_name NVARCHAR(20) NOT NULL,\
            job_length INTEGER,\
            job_gpio_pin INTEGER,\
            job_done INTEGER\
        )', (err) => {
            if (err) {
                console.log(err);
                console.log("Table immediate_jobs already exists.");
            } 
        });

        db.run('CREATE TABLE IF NOT EXISTS past_readings( \
            past_reading_id INTEGER PRIMARY KEY NOT NULL,\
            sensor_name NVARCHAR(20) NOT NULL,\
            date TIMESTAMP NVARCHAR(20),\
            daily_high INTEGER,\
            daily_low INTEGER,\
            daily_average REAL\
        )', (err) => {
            if (err) {
                console.log(err);
                console.log("Table past_readings already exists.");
            } 
        });
    }
});


// function turn_on_gpio(pin,milliseconds_to_run,job_name) {
//     console.log("Starting " + job_name)
    
//     rpio.write(pin, rpio.HIGH);
//     setTimeout(() => {rpio.write(pin, rpio.LOW)
//     console.log("Ending " + job_name)}, milliseconds_to_run);
    
// };


// get api endpoints

app.get("/zones", (req, res, next) => {
    db.all("SELECT * FROM zone_preferences", [], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.status(200).json({ rows });
    });
});

app.get("/lighting_preferences/:lighting_preference_id", (req, res, next) => {
    db.get("SELECT * FROM lighting_preferences WHERE lighting_preference_id = (?)",  
    [req.params.lighting_preference_id], 
    (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.status(200).json({ rows });
    });
});

app.get("/zone/:zone_preference_id", (req, res, next) => {
    db.get("SELECT * FROM zone_preferences WHERE zone_preference_id = (?)",  
    [req.params.zone_preference_id], 
    (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.status(200).json({ rows });
    });
});

app.get("/lighting_preferences", (req, res, next) => {
    db.all("SELECT * FROM lighting_preferences", [], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.status(200).json({ rows });
    });
});

app.get("/readings", (req, res, next) => {
    db.all("SELECT * FROM readings", [], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.status(200).json({ rows });
    });
});

app.get("/jobs", (req, res, next) => {
    db.all("SELECT * FROM jobs", [], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.status(200).json({ rows });
    });
});

function update_zone_preferences_check(sensor_name_var){
    // 1. return this new Promise() 
    return new Promise( (resolve, reject) => {
        db.run("INSERT OR IGNORE INTO zone_preferences (sensor_name, minimum_moisture, irrigation_trigger_by_moisture, irrigation_length, irrigation_interval, irrigation_time, gpio_pin) VALUES (?,?,?,?,?,?,?)",
        [sensor_name_var,"",0,"","","",""],
        function () {
            resolve("update_check_performed")
        });
    })
};

async function update_readings(reqBody, res, next){
    //console.log('running zone preference existence check..');
    let sensor_name_var = reqBody.sensor_name.replace("|","_");
    const result = await update_zone_preferences_check(sensor_name_var);
    //console.log(result)
    const inverted_reading = 1000 - reqBody.capacity   // capacity is inverted here.  The reading comes in meaning the closer to 1000 the dryer
    // and that is counter intuitive for most folks.  So it is being flipped.
    let current_time = new Date().toLocaleString().replace(',','');
    console.log( [reqBody.sensor_name.replace("|","_"), inverted_reading, current_time])
    db.run("INSERT INTO readings (sensor_name, capacity, time) VALUES (?,?,datetime('now','localtime'))",
        [reqBody.sensor_name.replace("|","_"), inverted_reading],
        function (err, result) {
            //console.log(reqBody)
            if (err) {
                res.status(400).json({ "error": err.message })
                return;
            }
            res.status(201).json({
                "reading_id": this.lastID
            })
        });
}

app.post("/reading/", (req, res, next) => {
    let reqBody = req.body;
    update_readings(reqBody, res, next);
});

function update_jobs_table_with_lighting_job(job_name_type,lighting_times_var,lighting_length_var,gpio_pin_var){
    // 1. return this new Promise() 
    return new Promise( (resolve, reject) => {
        console.log(job_name_type,lighting_times_var,lighting_length_var,gpio_pin_var)
        db.run("INSERT INTO jobs (job_name_type,job_time_of_day,job_length,job_gpio_pin) VALUES (?,?,?,?)\
        ON CONFLICT(job_name_type) DO UPDATE SET job_time_of_day=excluded.job_time_of_day,job_length=excluded.job_length,job_gpio_pin=excluded.job_gpio_pin;",
        [job_name_type,lighting_times_var,lighting_length_var,gpio_pin_var],
        function () {
            resolve("JOBS TABLE CHECKED/UPDATED")
        }
    );
    })
};



async function update_lighting(reqBody, res, next){
    console.log('running update of jobs table for lighting..');
    let job_type = "_lighting";
    let lighting_name_var = reqBody.lighting_name.replace("|","_");
    let lighting_times_var = reqBody.lighting_times;
    let job_name_type = lighting_name_var + job_type;
    let lighting_length_var = reqBody.lighting_length * 60; // minutes to seconds
    let gpio_pin_var = reqBody.gpio_pin;
    const result = await update_jobs_table_with_lighting_job(job_name_type,lighting_times_var,lighting_length_var,gpio_pin_var);   
    //console.log(result)
    db.run("INSERT INTO lighting_preferences (lighting_name, lighting_times, lighting_length, gpio_pin) VALUES (?,?,?,?)\
     ON CONFLICT(lighting_name) DO UPDATE SET lighting_times=excluded.lighting_times,lighting_length=excluded.lighting_length,gpio_pin=excluded.gpio_pin;", 
     [reqBody.lighting_name.replace("|","_"), reqBody.lighting_times,reqBody.lighting_length, reqBody.gpio_pin],
       function (err, result) {
           console.log(reqBody)
           if (err) {
               res.status(400).json({ "error": err.message })
               return;
           }
           res.status(201).json({
               "sensor zone update/creation": "Success"
           })
       });
}; 


app.put("/lighting_preferences/", (req, res, next) => {
    let reqBody = req.body;
    update_lighting(reqBody,res, next);
});

//Creation of immedidate jobs put 
app.put("/immediate_jobs/", (req, res, next) => {
    db.run("INSERT INTO immediate_jobs (sensor_name, job_length, job_gpio_pin, job_done) VALUES (?,?,?,?);",
    [req.body.sensor_name, req.body.job_length, req.body.job_gpio_pin, req.body.job_done],
    function (err, result) {
        console.log(req.body)
        if (err) {
            res.status(400).json({ "error": err.message })
            return;
        }
        res.status(201).json({
            "immediate job creation": "Success"
        })
    });
});

function update_jobs_table_with_watering_job(job_name_type,irrigation_time_var,irrigation_length_var,gpio_pin_var){
    return new Promise( (resolve, reject) => {
        //console.log(job_name_type,irrigation_time_var,irrigation_length_var,gpio_pin_var)
        db.run("INSERT INTO jobs (job_name_type,job_time_of_day,job_length,job_gpio_pin) VALUES (?,?,?,?)\
        ON CONFLICT(job_name_type) DO UPDATE SET job_time_of_day=excluded.job_time_of_day,job_length=excluded.job_length,job_gpio_pin=excluded.job_gpio_pin;",
        [job_name_type,irrigation_time_var,irrigation_length_var,gpio_pin_var],
        function () {
            resolve("JOBS TABLE CHECKED/UPDATED")
        }
    );
    })
};

async function update_zones(reqBody, res, next){
    let job_type = "_watering";
    let sensor_name_var = reqBody.sensor_name.replace("|","_");
    let irrigation_time_var = reqBody.irrigation_time;
    let job_name_type = sensor_name_var + job_type;
    let irrigation_length_var = reqBody.irrigation_length; //coming in as seconds
    let gpio_pin_var = reqBody.gpio_pin;
    const result = await update_jobs_table_with_watering_job(job_name_type,irrigation_time_var,irrigation_length_var,gpio_pin_var);
    db.run("INSERT INTO zone_preferences (sensor_name, minimum_moisture, irrigation_trigger_by_moisture, irrigation_length, irrigation_interval, irrigation_time, gpio_pin) VALUES (?,?,?,?,?,?,?)\
    ON CONFLICT(sensor_name) DO UPDATE SET minimum_moisture=excluded.minimum_moisture,irrigation_trigger_by_moisture=excluded.irrigation_trigger_by_moisture,irrigation_length=excluded.irrigation_length,irrigation_interval=excluded.irrigation_interval,irrigation_time=excluded.irrigation_time,gpio_pin=excluded.gpio_pin;", 
       [reqBody.sensor_name.replace("|","_"), reqBody.minimum_moisture, reqBody.irrigation_trigger_by_moisture, reqBody.irrigation_length, reqBody.irrigation_interval, reqBody.irrigation_time, reqBody.gpio_pin],
       function (err, result) {
           //console.log(reqBody)
           if (err) {
               res.status(400).json({ "error": err.message })
               return;
           }
           res.status(201).json({
               "sensor zone update/creation": "Success"
           })
       });
}; 

// async function lookup_jobs_async(){
//     const result = await lookup_jobs();
// }; 

app.put("/zones/", (req, res, next) => {
    let reqBody = req.body;
    update_zones(reqBody,res, next);
      // this is getting the updated jobs, which we should be able to use to create the schedule.
});

// delete api endpoints

function delete_zone_job_from_jobs_table(job_name_type){
    return new Promise( (resolve, reject) => {
        console.log(job_name_type + "_Deleting")
        db.run("DELETE FROM jobs WHERE job_name_type = (?)",
        [job_name_type],
        function () {
            resolve("JOBS TABLE CHECKED/UPDATED")
        }
    );
    })
};

async function delete_zone(req, res, next){
    console.log(req.params.zone_sensor_name);
    let job_name_type = req.params.zone_sensor_name + "_watering";
    delete_zone_job_from_jobs_table(job_name_type);
    console.log(job_name_type);
    db.run("DELETE FROM zone_preferences WHERE sensor_name = (?)",  
    req.params.zone_sensor_name, 
    (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.status(200).json({ rows });
    });
 }; 


app.delete("/zone/:zone_sensor_name", (req, res, next) => {
    delete_zone(req, res, next);
});

    
async function delete_lighting(req, res, next){
    let job_name_type = req.params.lighting_preference_name + "_lighting";
    delete_zone_job_from_jobs_table(job_name_type);
    console.log(job_name_type);    
    db.run("DELETE FROM lighting_preferences WHERE lighting_name = (?)",  
    [req.params.lighting_preference_name], 
    (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.status(200).json({ rows });
    });
}; 

app.delete("/lighting_preferences/:lighting_preference_name", (req, res, next) => {
    delete_lighting(req, res, next);
});

app.listen(HTTP_PORT, () => {
    console.log("Server is listening on port " + HTTP_PORT);
});