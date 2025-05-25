
import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Calendar, Clock, Plus, Users } from 'lucide-react';

const DailyPlanner = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const todayClasses = [
    {
      time: '09:00 AM',
      endTime: '10:30 AM',
      subject: 'Advanced Mathematics',
      instructor: 'Dr. Smith',
      students: 25,
      status: 'ongoing'
    },
    {
      time: '11:00 AM',
      endTime: '12:30 PM',
      subject: 'Physics Lab',
      instructor: 'Prof. Johnson',
      students: 18,
      status: 'upcoming'
    },
    {
      time: '02:00 PM',
      endTime: '03:30 PM',
      subject: 'Chemistry',
      instructor: 'Dr. Williams',
      students: 22,
      status: 'upcoming'
    },
    {
      time: '04:00 PM',
      endTime: '05:30 PM',
      subject: 'Biology',
      instructor: 'Prof. Davis',
      students: 20,
      status: 'upcoming'
    }
  ];

  const upcomingEvents = [
    {
      date: 'Oct 16',
      title: 'Parent-Teacher Meeting',
      time: '2:00 PM'
    },
    {
      date: 'Oct 18',
      title: 'Science Fair Setup',
      time: '10:00 AM'
    },
    {
      date: 'Oct 20',
      title: 'Monthly Assessment',
      time: '9:00 AM'
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Daily Planner</h1>
            <p className="text-gray-600">Manage your class schedules and events</p>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Add Class</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Today's Schedule */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Today's Classes</h3>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {todayClasses.map((classItem, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        classItem.status === 'ongoing' 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        <Clock className="h-6 w-6" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900">{classItem.subject}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          classItem.status === 'ongoing' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {classItem.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{classItem.instructor}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-sm font-medium text-gray-700">
                          {classItem.time} - {classItem.endTime}
                        </p>
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <Users className="h-4 w-4" />
                          <span>{classItem.students} students</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Upcoming Events</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {upcomingEvents.map((event, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{event.title}</p>
                        <p className="text-sm text-gray-500">{event.date} at {event.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Today's Overview</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Classes</span>
                    <span className="font-semibold text-gray-900">4</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Students</span>
                    <span className="font-semibold text-gray-900">85</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Hours Scheduled</span>
                    <span className="font-semibold text-gray-900">6</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Completion</span>
                    <span className="font-semibold text-green-600">25%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DailyPlanner;
