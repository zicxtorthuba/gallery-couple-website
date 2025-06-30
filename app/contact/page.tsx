"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formData);
    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="font-cormorant text-4xl md:text-5xl font-light mb-4">
              Liên hệ với chúng tôi
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Hãy để chúng tôi giúp bạn lưu giữ những khoảnh khắc đẹp nhất. Liên hệ ngay để được tư vấn.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact Information */}
            <div className="lg:col-span-1 space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="font-cormorant text-2xl font-light">
                    Thông tin liên hệ
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-[#93E1D8]/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-5 w-5 text-[#93E1D8]" />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Địa chỉ</h3>
                      <p className="text-muted-foreground text-sm">
                        123 Đường ABC, Quận XYZ<br />
                        Thành phố Hồ Chí Minh, Việt Nam
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-[#93E1D8]/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Phone className="h-5 w-5 text-[#93E1D8]" />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Điện thoại</h3>
                      <p className="text-muted-foreground text-sm">
                        +84 123 456 789<br />
                        +84 987 654 321
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-[#93E1D8]/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Mail className="h-5 w-5 text-[#93E1D8]" />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Email</h3>
                      <p className="text-muted-foreground text-sm">
                        hello@zunhee.com<br />
                        booking@zunhee.com
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-[#93E1D8]/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock className="h-5 w-5 text-[#93E1D8]" />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Giờ làm việc</h3>
                      <p className="text-muted-foreground text-sm">
                        Thứ 2 - Thứ 6: 9:00 - 18:00<br />
                        Thứ 7 - Chủ nhật: 10:00 - 16:00
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Services */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-cormorant text-2xl font-light">
                    Dịch vụ của chúng tôi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#93E1D8] rounded-full"></div>
                      Chụp ảnh cưới
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#93E1D8] rounded-full"></div>
                      Chụp ảnh gia đình
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#93E1D8] rounded-full"></div>
                      Chụp ảnh sự kiện
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#93E1D8] rounded-full"></div>
                      Chụp ảnh cá nhân
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#93E1D8] rounded-full"></div>
                      Thiết kế album
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="font-cormorant text-2xl font-light">
                    Gửi tin nhắn cho chúng tôi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Họ và tên *</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Nhập họ và tên"
                          required
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="Nhập địa chỉ email"
                          required
                          className="h-12"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Số điện thoại</Label>
                        <Input
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="Nhập số điện thoại"
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subject">Chủ đề *</Label>
                        <Input
                          id="subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleInputChange}
                          placeholder="Nhập chủ đề"
                          required
                          className="h-12"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Tin nhắn *</Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        placeholder="Nhập tin nhắn của bạn..."
                        required
                        rows={6}
                        className="resize-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full md:w-auto bg-[#93E1D8] hover:bg-[#93E1D8]/90 text-white px-8 py-3 h-auto"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Gửi tin nhắn
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Map Section */}
          <div className="mt-16">
            <Card>
              <CardContent className="p-0">
                <div className="relative h-96 bg-gray-200 rounded-lg overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="h-12 w-12 text-[#93E1D8] mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Bản đồ sẽ được hiển thị tại đây
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}