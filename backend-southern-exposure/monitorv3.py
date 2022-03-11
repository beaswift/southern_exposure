import sqlite3
import multiprocessing
import threading
import time
import schedule
import RPi.GPIO as GPIO
import ast
import csv

pinList = [13,15]

GPIO.setmode(GPIO.BOARD)

for i in pinList:
    GPIO.setup(i, GPIO.OUT)
    GPIO.output(i, GPIO.LOW)

def job(name,pin):
    if name.startswith("Test_Tomato_Sensor"):
        seconds = 11
    else:
        seconds = 15
    print("I worked for" + name)
    GPIO.output(pin, GPIO.HIGH)
    time.sleep(seconds)
    GPIO.output(pin, GPIO.LOW)
    #print(threading.currentThread().ident)

def is_valid_worker(name_var):
    # f = open("definitions.csv", "r")
    # file_read = csv.reader(f)
    array_of_acceptable = get_valid_processes(sqliteConnection)
    if name_var in array_of_acceptable:
        return True
    return False
    #print(array_of_acceptable)
    #time.sleep(5)

def worker(name_var):
    """worker function"""
    if name_var.startswith("Test_Tomato_Sensor"):
        gpio_pin = 13
    else:
        gpio_pin = 15
    thisJob = schedule.every().minute.at(":23").do(job, name = name_var, pin = gpio_pin )
    print("reached "+name_var+ "multiprocess")
    while True:
        if is_valid_worker(name_var):
            schedule.run_pending()
            print("I'm alive " + name_var)
            continue
        else:
            print("I'm not on the list!")
            print("oh God I gotta kill myself")
            schedule.cancel_job(thisJob)
            #time.sleep(1)
            break

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
                    schedule_item = row[1]+item+str(row[3])
                    jobs_on_table.append(schedule_item)
        cursor.close()
        return jobs_on_table
    except sqlite3.Error as error:
        raise error

def connect_db(sqliteConnection):
    jobs = []  # this is the array that is keeping these multiprocesses alive
    accepted_processes = []  # this is the array of what should alive at any one time
    while True:
        try:
            jobs_on_table = get_valid_processes(sqliteConnection)
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
            #with open('./definitions.csv', 'w') as outfile:
            #    writer = csv.writer(outfile)
             #   for x in accepted_processes : writer.writerow ([x])  
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