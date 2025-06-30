"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Camera, 
  Heart, 
  BookOpen, 
  Settings, 
  Upload,
  Star,
  Calendar,
  Activity,
  HardDrive,
  Edit3,
  Save,
  X,
  CheckCircle
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AuthGuard } from '@/components/AuthGuard';
import { getStoredUser, updateStoredUser, type User as UserType } from '@/lib/auth';
import { userData } from '@/lib/data';

function PersonalContent() {
  const [user, setUser] = useState<UserType | null>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    profilePicture: null as File | null
  });
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    const currentUser = getStoredUser();
    setUser(currentUser);
    
    if (currentUser) {
      // Get user data based on role/name
      const stats = userData[currentUser.role as keyof typeof userData] || userData.user1;
      setUserStats(stats);
      setEditData({
        name: currentUser.name,
        profilePicture: null
      });
      setProfilePicturePreview(stats.profilePicture);
    }
  }, []);

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditData(prev => ({ ...prev, profilePicture: file }));
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicturePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    if (!user || !userStats) return;

    // Update user name
    const updatedUser = { ...user, name: editData.name };
    updateStoredUser(updatedUser);
    setUser(updatedUser);

    // Update profile picture in userStats (in real app, this would be saved to backend)
    if (editData.profilePicture) {
      userStats.profilePicture = profilePicturePreview;
    }

    setIsEditingProfile(false);
    setSaveMessage('Thông tin đã được cập nhật thành công!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleCancelEdit = () => {
    if (user) {
      setEditData({
        name: user.name,
        profilePicture: null
      });
      setProfilePicturePreview(userStats?.profilePicture || null);
    }
    setIsEditingProfile(false);
  };

  if (!user || !userStats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#93E1D8]"></div>
      </div>
    );
  }

  const storagePercentage = (userStats.storageUsed / userStats.storageLimit) * 100;
  const storageUsedMB = userStats.storageUsed;
  const storageLimitMB = userStats.storageLimit;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Success Message */}
          {saveMessage && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700">
                {saveMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-6 mb-6">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  {profilePicturePreview ? (
                    <AvatarImage src={profilePicturePreview} alt={user.name} />
                  ) : (
                    <AvatarFallback className="bg-[#93E1D8] text-white text-2xl">
                      {user.name[0].toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                {isEditingProfile && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <label htmlFor="profile-picture" className="cursor-pointer">
                      <Camera className="h-6 w-6 text-white" />
                      <input
                        id="profile-picture"
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePictureChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
              <div className="flex-1">
                {isEditingProfile ? (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="edit-name">Tên hiển thị</Label>
                      <Input
                        id="edit-name"
                        value={editData.name}
                        onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                        className="mt-1 max-w-xs"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveProfile}
                        size="sm"
                        className="bg-[#93E1D8] hover:bg-[#93E1D8]/90"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Lưu
                      </Button>
                      <Button
                        onClick={handleCancelEdit}
                        variant="outline"
                        size="sm"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Hủy
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="font-cormorant text-3xl font-light mb-2">
                      {user.name}
                    </h1>
                    <p className="text-muted-foreground">
                      {user.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Tham gia từ tháng 1, 2024</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
              {!isEditingProfile && (
                <Button
                  onClick={() => setIsEditingProfile(true)}
                  variant="outline"
                  size="sm"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Chỉnh sửa
                </Button>
              )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#93E1D8]/10 rounded-full flex items-center justify-center">
                      <Camera className="h-5 w-5 text-[#93E1D8]" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{userStats.uploadedImages.length}</p>
                      <p className="text-sm text-muted-foreground">Ảnh đã tải</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#FFA69E]/10 rounded-full flex items-center justify-center">
                      <Heart className="h-5 w-5 text-[#FFA69E]" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">0</p>
                      <p className="text-sm text-muted-foreground">Lượt thích</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{userStats.savedBlogs.length}</p>
                      <p className="text-sm text-muted-foreground">Blog đã lưu</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Star className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{userStats.collections.length}</p>
                      <p className="text-sm text-muted-foreground">Bộ sưu tập</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Tổng quan</TabsTrigger>
              <TabsTrigger value="photos">Ảnh của tôi</TabsTrigger>
              <TabsTrigger value="collections">Bộ sưu tập</TabsTrigger>
              <TabsTrigger value="settings">Cài đặt</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Storage Usage */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HardDrive className="h-5 w-5" />
                      Dung lượng lưu trữ
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span>Đã sử dụng</span>
                        <span>{storageUsedMB} MB / {storageLimitMB} MB</span>
                      </div>
                      <Progress value={storagePercentage} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        Còn lại {(storageLimitMB - storageUsedMB)} MB
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Hoạt động gần đây
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userStats.activityHistory.length > 0 ? (
                      <div className="space-y-3">
                        {userStats.activityHistory.slice(0, 5).map((activity: any, index: number) => (
                          <div key={index} className="flex items-center gap-3 text-sm">
                            <div className="w-2 h-2 bg-[#93E1D8] rounded-full"></div>
                            <div className="flex-1">
                              <p>{activity.action}: <span className="font-medium">{activity.item}</span></p>
                              <p className="text-xs text-muted-foreground">{activity.date}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">Chưa có hoạt động nào</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="photos" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ảnh của tôi</CardTitle>
                </CardHeader>
                <CardContent>
                  {userStats.uploadedImages.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Placeholder for uploaded images */}
                      <div className="text-center text-muted-foreground">
                        Ảnh đã tải lên sẽ hiển thị ở đây
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-medium mb-2">Chưa có ảnh nào</h3>
                      <p className="text-muted-foreground mb-4">
                        Bắt đầu chia sẻ những khoảnh khắc đẹp của bạn
                      </p>
                      <Button className="bg-[#93E1D8] hover:bg-[#93E1D8]/90">
                        <Upload className="h-4 w-4 mr-2" />
                        Tải ảnh lên
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="collections" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Bộ sưu tập của tôi</CardTitle>
                </CardHeader>
                <CardContent>
                  {userStats.collections.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {userStats.collections.map((collection: any) => (
                        <Card key={collection.id}>
                          <CardContent className="p-4">
                            <h4 className="font-medium mb-2">{collection.name}</h4>
                            <p className="text-sm text-muted-foreground mb-2">
                              {collection.images.length} ảnh
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Tạo ngày {collection.createdAt}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-medium mb-2">Chưa có bộ sưu tập nào</h3>
                      <p className="text-muted-foreground mb-4">
                        Tạo bộ sưu tập để tổ chức ảnh của bạn
                      </p>
                      <Button variant="outline">
                        <Star className="h-4 w-4 mr-2" />
                        Tạo bộ sưu tập
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Cài đặt tài khoản
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-4">Thông tin cá nhân</h4>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                          {profilePicturePreview ? (
                            <AvatarImage src={profilePicturePreview} alt={user.name} />
                          ) : (
                            <AvatarFallback className="bg-[#93E1D8] text-white text-xl">
                              {user.name[0].toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {user.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                          </p>
                        </div>
                        <Button
                          onClick={() => setIsEditingProfile(true)}
                          variant="outline"
                          size="sm"
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          Chỉnh sửa
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-4">Dung lượng lưu trữ</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Đã sử dụng</span>
                        <span>{storageUsedMB} MB / {storageLimitMB} MB</span>
                      </div>
                      <Progress value={storagePercentage} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        Bạn có thể tải lên tối đa {storageLimitMB} MB dữ liệu
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default function PersonalPage() {
  return (
    <AuthGuard>
      <Navbar />
      <PersonalContent />
      <Footer />
    </AuthGuard>
  );
}