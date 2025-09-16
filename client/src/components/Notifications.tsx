import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Bell, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Users, 
  FileText, 
  Settings,
  X,
  Eye,
  Trash2
} from 'lucide-react';

const notifications = [
  {
    id: 1,
    type: 'reminder',
    title: 'Evaluation Period Ending Soon',
    message: 'Faculty Performance Evaluation - Spring 2024 will end in 3 days. 156 responses pending.',
    timestamp: '2 hours ago',
    read: false,
    priority: 'high',
    action: 'View Details'
  },
  {
    id: 2,
    type: 'system',
    title: 'System Maintenance Scheduled',
    message: 'Planned maintenance on March 15, 2024 at 2:00 AM. System will be offline for approximately 2 hours.',
    timestamp: '5 hours ago',
    read: false,
    priority: 'medium',
    action: 'Acknowledge'
  },
  {
    id: 3,
    type: 'alert',
    title: 'Low Response Rate Alert',
    message: 'Staff Annual Review 2024 has only 23% completion rate. Consider sending reminders.',
    timestamp: '1 day ago',
    read: true,
    priority: 'medium',
    action: 'Send Reminders'
  },
  {
    id: 4,
    type: 'success',
    title: 'Report Generated Successfully',
    message: 'Q4 Performance Analytics Report has been generated and is ready for download.',
    timestamp: '1 day ago',
    read: true,
    priority: 'low',
    action: 'Download'
  },
  {
    id: 5,
    type: 'reminder',
    title: 'New User Registration',
    message: '5 new faculty members have registered and are pending approval for account activation.',
    timestamp: '2 days ago',
    read: false,
    priority: 'medium',
    action: 'Review Users'
  },
  {
    id: 6,
    type: 'system',
    title: 'Database Backup Completed',
    message: 'Weekly database backup completed successfully. All data is secure.',
    timestamp: '3 days ago',
    read: true,
    priority: 'low',
    action: 'View Logs'
  }
];

const getNotificationIcon = (type) => {
  switch (type) {
    case 'reminder': return <Clock className="w-5 h-5 text-blue-500" />;
    case 'alert': return <AlertCircle className="w-5 h-5 text-red-500" />;
    case 'system': return <Settings className="w-5 h-5 text-gray-500" />;
    case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
    default: return <Bell className="w-5 h-5 text-gray-500" />;
  }
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'high': return 'bg-red-100 text-red-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'low': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function Notifications() {
  const [activeTab, setActiveTab] = useState('all');
  const [notificationList, setNotificationList] = useState(notifications);

  const unreadCount = notificationList.filter(n => !n.read).length;
  const filteredNotifications = activeTab === 'all' 
    ? notificationList 
    : activeTab === 'unread'
    ? notificationList.filter(n => !n.read)
    : notificationList.filter(n => n.type === activeTab);

  const markAsRead = (id) => {
    setNotificationList(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const deleteNotification = (id) => {
    setNotificationList(prev => prev.filter(n => n.id !== id));
  };

  const markAllAsRead = () => {
    setNotificationList(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
          <p className="text-gray-600 mt-1">System alerts, reminders, and updates</p>
        </div>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <Button 
              onClick={markAllAsRead}
              variant="outline" 
              className="border-gray-200 text-gray-600"
            >
              Mark All as Read
            </Button>
          )}
          <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 rounded-full">
            <Bell className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">{unreadCount} unread</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="all">All ({notificationList.length})</TabsTrigger>
          <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
          <TabsTrigger value="reminder">Reminders</TabsTrigger>
          <TabsTrigger value="alert">Alerts</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="success">Success</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`border-0 shadow-md transition-all ${
                  !notification.read 
                    ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                    : 'bg-white'
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900">{notification.title}</h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{notification.message}</p>
                        <div className="flex items-center space-x-4">
                          <span className="text-xs text-gray-500">{notification.timestamp}</span>
                          <Badge className={getPriorityColor(notification.priority)}>
                            {notification.priority} priority
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!notification.read && (
                        <Button
                          onClick={() => markAsRead(notification.id)}
                          variant="outline"
                          size="sm"
                          className="border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-200"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-200"
                      >
                        {notification.action}
                      </Button>
                      <Button
                        onClick={() => deleteNotification(notification.id)}
                        variant="outline"
                        size="sm"
                        className="border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-0 shadow-md">
              <CardContent className="p-12 text-center">
                <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                <p className="text-gray-500">
                  {activeTab === 'unread' 
                    ? 'All caught up! No unread notifications.' 
                    : 'No notifications found for this filter.'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Configure how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="font-medium text-gray-900">User Activities</p>
                  <p className="text-sm text-gray-600">Registration, login alerts</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium text-gray-900">Evaluation Updates</p>
                  <p className="text-sm text-gray-600">Form submissions, deadlines</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Settings className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="font-medium text-gray-900">System Events</p>
                  <p className="text-sm text-gray-600">Maintenance, backups</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <div>
                  <p className="font-medium text-gray-900">Critical Alerts</p>
                  <p className="text-sm text-gray-600">Errors, security issues</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}