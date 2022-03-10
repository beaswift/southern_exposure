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

def worker(name_var):
    """worker function"""
    if name_var.startswith("Test_Tomato_Sensor"):
        gpio_pin = 13
    else:
        gpio_pin = 15
    thisJob = schedule.every().minute.at(":23").do(job, name = name_var, pin = gpio_pin )
    print("reached "+name_var+ "multiprocess")
    while True:
        schedule.run_pending()
        f = open("definitions.csv", "r")
        file_read = csv.reader(f)
        array_of_acceptable = list(file_read)
        processed_array = []
        for each in array_of_acceptable:
          processed_array.append(each[0])
        if name_var not in processed_array:
          print(name_var)
          print(processed_array)
          print("I'm not on the list!")
          print("oh God I gotta kill myself")
          schedule.cancel_job(thisJob)
          break
        else:
          schedule.run_pending()
          print("I'm alive " + name_var)
          continue
    
def connect_db():

  while True:
    try:
        sqliteConnection = sqlite3.connect('./southern_exposure_database.db')
        schedule.run_pending()
        cursor = sqliteConnection.cursor()
        sqlite_select_Query = "SELECT * FROM jobs;"
        cursor.execute(sqlite_select_Query)
        sqliteConnection.row_factory = sqlite3.Row
        record = cursor.fetchall()
        jobs_on_table = []
        for row in record:
          if len(row[2]) >= 4:
            time_list = row[2].split(",")
            for item in time_list:
                schedule_item = row[1]+item+str(row[3])
                jobs_on_table.append(schedule_item)
        if sorted(jobs_on_table) != sorted(accepted_processes):
            print("Jobs on Table Do Not Match Schedule")
            for each in list(set(accepted_processes) - set(jobs_on_table)):
                accepted_processes.remove(each)
            for each  in list(set(jobs_on_table) - set(accepted_processes)):
                accepted_processes.append(each)
                p = multiprocessing.Process(target=worker, args=(each,))
                jobs.append(p)
                p.start()
            with open('./definitions.csv', 'w') as outfile:
                writer = csv.writer(outfile)
                for x in accepted_processes : writer.writerow ([x])  
        else:
            pass
            cursor.close()

    except sqlite3.Error as error:
        print("Error while connecting to sqlite", error)
    finally:
        if sqliteConnection:
            sqliteConnection.close()

if __name__ == '__main__':
    jobs = []  # this is the array that is keeping these multiprocesses alive
    accepted_processes = []  # this is the array of what should alive at any one time
    connect_db()






        