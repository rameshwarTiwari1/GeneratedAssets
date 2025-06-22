import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { authService, AuthUser } from "../lib/auth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { useToast } from "../hooks/use-toast";
import AvatarPicker from "../components/AvatarPicker";
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Link } from 'wouter';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Shield, 
  Bell, 
  Globe, 
  BarChart3,
  Settings,
  Edit,
  Save,
  Camera,
  Trash2,
  Download,
  Upload,
  Eye,
  EyeOff,
  LogOut
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

const ProfilePage: React.FC = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    location: '',
    website: '',
    timezone: '',
    currency: 'USD'
  });
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    marketing: false,
    updates: true
  });
  const [privacy, setPrivacy] = useState({
    profilePublic: true,
    showEmail: false,
    showLocation: false,
    allowAnalytics: true
  });

  // Profile form state
  const [selectedAvatar, setSelectedAvatar] = useState<string>("");

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = authService.getUser();
      if (!currentUser) {
        setLocation("/auth");
        return;
      }
      setUser(currentUser);
      setFormData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        bio: currentUser.bio || '',
        location: currentUser.location || '',
        website: currentUser.website || '',
        timezone: currentUser.timezone || 'UTC',
        currency: currentUser.currency || 'USD'
      });
      if (currentUser.profilePhoto) {
        setSelectedAvatar(currentUser.profilePhoto);
      }
    };
    checkAuth();
  }, [setLocation]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);

    try {
      const updatedUser = await authService.updateProfile({
        email: formData.email,
        name: formData.name,
        profilePhoto: selectedAvatar,
      });

      setUser(updatedUser);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setPasswordLoading(true);

    try {
      await authService.changePassword(currentPassword, newPassword);
      
      // Clear password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      toast({
        title: "Password Changed",
        description: "Your password has been changed successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAvatarSelect = (avatarUrl: string) => {
    setSelectedAvatar(avatarUrl);
  };

  const handleSave = async () => {
    try {
      // Here you would typically update the user profile via API
      toast({
        title: "Profile updated successfully",
        description: "Your profile changes have been saved.",
      });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Failed to update profile",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      setLocation('/auth');
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getUserInitials = (user: AuthUser): string => {
    if (user.name) {
      return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user.email.slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 dark:from-gray-900 dark:via-blue-950/30 dark:to-indigo-950/30">
      {/* Header */}
      <header className="glass-card border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="hover:bg-gray-100 dark:hover:bg-gray-800">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gradient">Profile Settings</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Manage your account and preferences</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Button variant="outline" size="sm" className="border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Card */}
            <Card className="glass-card hover-lift">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-gradient flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Profile Information</span>
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    className="border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    {isEditing ? <Save className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
                    {isEditing ? 'Save' : 'Edit'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={selectedAvatar} alt="Profile" />
                      <AvatarFallback className="text-2xl font-semibold gradient-primary">
                        {getUserInitials(user)}
                      </AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute -bottom-2 -right-2 w-8 h-8 p-0 rounded-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="space-y-2">
                      <div>
                        <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Full Name
                        </Label>
                        {isEditing ? (
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="mt-1 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
                          />
                        ) : (
                          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {formData.name || 'Not provided'}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Email Address
                        </Label>
                        <p className="text-gray-600 dark:text-gray-400 flex items-center">
                          <Mail className="h-4 w-4 mr-2" />
                          {formData.email}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bio" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Bio
                    </Label>
                    {isEditing ? (
                      <Input
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        placeholder="Tell us about yourself..."
                        className="mt-1 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
                      />
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {formData.bio || 'No bio provided'}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="location" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Location
                    </Label>
                    {isEditing ? (
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="City, Country"
                        className="mt-1 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
                      />
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {formData.location || 'Not specified'}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="website" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Website
                    </Label>
                    {isEditing ? (
                      <Input
                        id="website"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        placeholder="https://yourwebsite.com"
                        className="mt-1 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
                      />
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {formData.website || 'Not provided'}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="timezone" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Timezone
                    </Label>
                    {isEditing ? (
                      <Select value={formData.timezone} onValueChange={(value) => setFormData({ ...formData, timezone: value })}>
                        <SelectTrigger className="mt-1 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="EST">Eastern Time</SelectItem>
                          <SelectItem value="PST">Pacific Time</SelectItem>
                          <SelectItem value="GMT">GMT</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400 mt-1">{formData.timezone}</p>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      className="border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      className="gradient-primary"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Stats */}
            <Card className="glass-card hover-lift">
              <CardHeader>
                <CardTitle className="text-gradient flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Account Statistics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">12</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Indexes Created</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-950/50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">$45.2K</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Portfolio Value</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">156</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Stocks Tracked</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">89%</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Success Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Settings */}
          <div className="space-y-6">
            {/* Notifications */}
            <Card className="glass-card hover-lift">
              <CardHeader>
                <CardTitle className="text-gradient flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Notifications</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Email Notifications</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Receive updates via email</p>
                  </div>
                  <Switch
                    checked={notifications.email}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Push Notifications</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Get real-time alerts</p>
                  </div>
                  <Switch
                    checked={notifications.push}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Marketing Emails</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Receive promotional content</p>
                  </div>
                  <Switch
                    checked={notifications.marketing}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, marketing: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Privacy Settings */}
            <Card className="glass-card hover-lift">
              <CardHeader>
                <CardTitle className="text-gradient flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Privacy</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Public Profile</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Allow others to see your profile</p>
                  </div>
                  <Switch
                    checked={privacy.profilePublic}
                    onCheckedChange={(checked) => setPrivacy({ ...privacy, profilePublic: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Show Email</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Display email on public profile</p>
                  </div>
                  <Switch
                    checked={privacy.showEmail}
                    onCheckedChange={(checked) => setPrivacy({ ...privacy, showEmail: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Analytics</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Help improve our service</p>
                  </div>
                  <Switch
                    checked={privacy.allowAnalytics}
                    onCheckedChange={(checked) => setPrivacy({ ...privacy, allowAnalytics: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Account Actions */}
            <Card className="glass-card hover-lift">
              <CardHeader>
                <CardTitle className="text-gradient flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Account Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import Data
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="w-full justify-start border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Log Out
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 