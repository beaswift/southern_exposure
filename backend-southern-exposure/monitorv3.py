import sqlite3
import multiprocessing
import threading
import time
from datetime import datetime
import schedule
import RPi.GPIO as GPIO
import ast

pinList = [3,5,7,8]
GPIO.setwarnings(False)
 
GPIO.setmode(GPIO.BOARD)

for i in pinList:
   GPIO.setup(i, GPIO.OUT)
   GPIO.output(i, GPIO.HIGH)

def job(job_length,pin,job_name):
    GPIO.setup(pin, GPIO.OUT)
    GPIO.output(pin, GPIO.HIGH)
    GPIO.output(pin, GPIO.LOW)
    time.sleep(job_length)
    GPIO.output(pin, GPIO.HIGH)
    GPIO.cleanup(pin)
    print("DID THE JOB")
    print(job_name)
    if "_lighting" not in job_name:  #If job was a watering job, log the watering time
        job_name = job_name.replace("_watering","")
        log_watering_time(sqliteConnection,job_name)

def is_valid_worker(name_var):
    array_of_acceptable = get_valid_processes(sqliteConnection)
    if name_var in array_of_acceptable:
        return True
    return False

def worker(name_var):
    """worker function"""
    worker_def_array = name_var.split("|")
    job_name = worker_def_array[0]
    hour = worker_def_array[1][:2]
    minute = worker_def_array[1][2:4]
    gpio_pin = int(worker_def_array[3])
    job_length_variable = int(worker_def_array[2])
    # Split name_var here into it's parts for usage:
    thisJob = schedule.every().day.at(hour+":"+minute).do(job, job_length = job_length_variable, pin = gpio_pin, job_name=job_name)
    #print("reached "+name_var+ "multiprocess")
    while True:
        if is_valid_worker(name_var):
            schedule.run_pending()
            #print("I'm alive " + name_var)
            continue
        else:
            print("I'm not on the list!")
            print("oh God I gotta kill myself")
            #time.sleep(1)
            break

def log_watering_time(sqliteConnection,sensor_name):
    try:
        cursor = sqliteConnection.cursor()
        cursor.execute("UPDATE zone_preferences SET last_watering = datetime('now','localtime') WHERE sensor_name = ?", (sensor_name,));
        sqliteConnection.commit()
        cursor.close()
    except sqlite3.Error as error:
        raise error

def get_valid_processes(sqliteConnection):
    jobs_on_table = []
    try:
        cursor = sqliteConnection.cursor()
        sqlite_select_Query = "SELECT * FROM jobs;"
        cursor.execute(sqlite_select_Query)
        sqliteConnection.row_factory = sqlite3.Row
        record = cursor.fetchall()
        for row in record:
            if len(row[2]) >= 4:
                time_list = row[2].split(",")
                for item in time_list:
                    schedule_item = row[1]+"|"+item+"|"+str(row[3])+"|"+str(row[4])
                    jobs_on_table.append(schedule_item)
        cursor.close()
        return jobs_on_table
    except sqlite3.Error as error:
        raise error

def get_recent_readings(sqliteConnection,sensor_name):
    cursor = sqliteConnection.cursor()  
    #query_for_recent_readings = "select readings.* from readings where readings.sensor_name="+sensor_name+" order by readings.time DESC limit 3;"
    #cursor.execute("UPDATE zone_preferences SET last_watering = datetime('now','localtime') WHERE sensor_name = ?", (sensor_name,));
    cursor.execute("select readings.capacity from readings where readings.sensor_name= ? order by readings.time DESC limit 3;", (sensor_name,));
    #cursor.execute(query_for_recent_readings)
    sqliteConnection.row_factory = sqlite3.Row
    record = cursor.fetchall()
    return record



def get_sensor_reading_jobs(sqliteConnection):
    sensor_reading_jobs = []
    try:
        cursor = sqliteConnection.cursor()
        sqlite_select_Query = "SELECT * FROM zone_preferences where irrigation_trigger_by_moisture = 1;"
        cursor.execute(sqlite_select_Query)
        sqliteConnection.row_factory = sqlite3.Row
        record = cursor.fetchall()
        for row in record:
            job_id = row[0]
            sensor_name = row[1]
            minimum_moisture = row[3]
            job_length = row[4]
            interval = row[5]
            job_pin = row[7]
            last_job_time = datetime.strptime(row[8], '%Y-%m-%d %X')
            recent_readings = get_recent_readings(sqliteConnection,sensor_name)
            #print(recent_readings)
            timesince = (datetime.now() - last_job_time).seconds/60 
            count = 0
            for row in recent_readings:
                #print(row[0])
                if row[0] < minimum_moisture:
                    count = count + 1
            if count == 3:
                if timesince > interval:
                    print("Moisture Sensor trigger for: " + sensor_name)
                    p = multiprocessing.Process(target=job, args=(job_length,job_pin,sensor_name))
                    sensor_reading_jobs.append(p)
                    p.start()
        cursor.close()
    except sqlite3.Error as error:
        raise error

def get_immediate_jobs(sqliteConnection):
    immediate_jobs = []
    try:
        cursor = sqliteConnection.cursor()
        sqlite_select_Query = "SELECT * FROM immediate_jobs where job_done = 0;"
        cursor.execute(sqlite_select_Query)
        sqliteConnection.row_factory = sqlite3.Row
        record = cursor.fetchall()
        #print("Inside get_immediate_jobs")
        for row in record:
            job_id = row[0]
            sensor_name = row[1]
            job_length = row[2]
            job_pin = row[3]
            p = multiprocessing.Process(target=job, args=(job_length,job_pin,sensor_name))
            immediate_jobs.append(p)
            p.start()
            #job(job_length,job_pin)
            cursor = sqliteConnection.cursor()
            sqlite_update_Query = "UPDATE immediate_jobs SET job_done = 1 where job_id = " + str(job_id) + ";"
            cursor.execute(sqlite_update_Query)
            sqliteConnection.commit()
            #print("Cleared Immediate job for pin " + str(job_pin)+ " of table, as completed.")
        cursor.close()
    except sqlite3.Error as error:
        raise error

def connect_db(sqliteConnection):
    jobs = []  # this is the array that is keeping these multiprocesses alive
    accepted_processes = []  # this is the array of what should alive at any one time
    while True:
        try:
            jobs_on_table = get_valid_processes(sqliteConnection)
            get_immediate_jobs(sqliteConnection)
            get_sensor_reading_jobs(sqliteConnection)
        except Exception as e:
            raise e
            return
        if sorted(jobs_on_table) != sorted(accepted_processes):
            print("Jobs on Table Do Not Match Schedule")
            for each in list(set(accepted_processes) - set(jobs_on_table)):
                accepted_processes.remove(each)
            for each  in list(set(jobs_on_table) - set(accepted_processes)):
                print("Appending process: "+each)
                accepted_processes.append(each)
                p = multiprocessing.Process(target=worker, args=(each,))
                jobs.append(p)
                p.start()
        else:
            time.sleep(5)


if __name__ == '__main__':
    try:
        sqliteConnection = sqlite3.connect('./southern_exposure_database.db')
    except Exception as e:
        print(e)
        exit
    connect_db(sqliteConnection)
    sqliteConnection.close()