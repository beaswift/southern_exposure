import sqlite3
import threading
import time
import schedule
from threading import Thread

import RPi.GPIO as GPIO
import time

pinList = [13,15]

GPIO.setmode(GPIO.BOARD)

for i in pinList:
    GPIO.setup(i, GPIO.OUT)
    GPIO.output(i, GPIO.LOW)

accepted_threads = []
threads = []

def job(name,pin):
  if name.startswith("Test_Tomato_Sensor"):
    seconds = 11
  else:
    seconds = 4
  print("I worked for" + name)
  GPIO.output(pin, GPIO.HIGH)
  time.sleep(seconds)
  GPIO.output(pin, GPIO.LOW)
  print(threading.currentThread().ident)
  #pass
  
def job_task(name):
  print(name)


def threaded_function_start(name_var):
  if name_var.startswith("Test_Tomato_Sensor"):
    gpio_pin = 13
  else:
    gpio_pin = 15
  thisJob = schedule.every().minute.at(":23").do(job, name = name_var, pin = gpio_pin )
  #thisJob = schedule.every(5).seconds.do(job, name = name_var, pin = gpio_pin )
  print("reached threaded "+name_var)
  while True:
    schedule.run_pending()
    if name_var not in accepted_threads:
      schedule.cancel_job(thisJob)
      print("oh God I gotta kill myself")
      break
    else:
      continue
      
    

def connect_db():
  global accepted_threads
  global threads

  threading.Timer(1, connect_db).start()
  try:
    time.sleep(2)
    sqliteConnection = sqlite3.connect('./southern_exposure_database.db')
    cursor = sqliteConnection.cursor()
    sqlite_select_Query = "SELECT * FROM jobs;"
    cursor.execute(sqlite_select_Query)
    sqliteConnection.row_factory = sqlite3.Row
    record = cursor.fetchall()
    #print("JOBS RECORDS:")
    jobs_on_table = []
    for row in record:
      if len(row[2]) >= 4:
        time_list = row[2].split(",")
        for item in time_list:
          schedule_item = row[1]+item+str(row[3])
          jobs_on_table.append(schedule_item)
    #print("Jobs On Table:")
    if sorted(jobs_on_table) != sorted(accepted_threads):
      print("Jobs on Table Do Not Match Schedule")
      #print("Jobs to be Removed:")
      #print(list(set(accepted_threads) - set(jobs_on_table)))
      for each in list(set(accepted_threads) - set(jobs_on_table)):
        # These are ones not on the table, should be deleted:
        accepted_threads.remove(each)
      #print("Jobs to be Added:")
      #print(list(set(jobs_on_table) - set(accepted_threads)))
      #threads = []
      for each  in list(set(jobs_on_table) - set(accepted_threads)):
        accepted_threads.append(each)
        th = Thread(target = threaded_function_start(each))
        th.setDaemon(True)
        #th.start()
        threads.append(th)
      for thread in threads:
        thread.start()
    else: 
      for thread in threads:
        thread.start()
      print("Jobs Match Schedule Array.")
      all_jobs = schedule.get_jobs()
      #print("All Jobs:")
      #print(all_jobs)
     #print("")
      #print("Accepted threads")
      #print(accepted_threads)
      #print("")
      #schedule.run_pending()
      #print("Threads:")
      #for thread in threading.enumerate(): 
      # print(thread.name)
      #print("\n")
    cursor.close()

  except sqlite3.Error as error:
    print("Error while connecting to sqlite", error)
  finally:
    if sqliteConnection:
      sqliteConnection.close()


connect_db()
