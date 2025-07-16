"use client";

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Heart, 
  Search, 
  Filter, 
  Eye, 
  Download, 
  Upload, 
  Edit3, 
  Star,
  Plus,
  X,
  Save,
  Trash2,
  Tag,
  Camera,
  ImageIcon,
  AlertTriangle,
  CheckCircle,
  FileImage
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AuthGuard } from '@/components/AuthGuard';
import { AlbumManager } from '@/components/albums/AlbumManager';
import { useEdgeStore } from '@/lib/edgestore';
import { 
  isFileSizeValid, 
  formatBytes,
  MAX_FILE_SIZE
} from '@/lib/storage';
import {
  getGalleryImages,
  createGalleryImage,
  updateGalleryImage,
  deleteGalleryImage,
  updateImageLikes,
  getGalleryCategories,
  getGalleryTags,
  type GalleryImage
} from '@/lib/gallery-supabase';
import { addToFavorites, removeFromFavorites, isFavorite } from '@/lib/favorites-supabase';
import { getCurrentUser } from '@/lib/auth';
import image from 'next/image';
import image from 'next/image';
import image from 'next/image';
import { title } from 'process';
import { title } from 'process';
import image from 'next/image';
import image from 'next/image';
import { set } from 'zod';

function GalleryContent() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [filteredImages, setFilteredImages] = useState<GalleryImage[]>([]);
  const [activeTab, setActiveTab] = useState('images');
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [deleteConfirmStep, setDeleteConfirmStep] = useState<{ image: GalleryImage; step: 1 | 2 } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [likedImages, setLikedImages] = useState<Set<string>>(new Set());
  const [favoriteImages, setFavoriteImages] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [message, setMessage] = useState('');

  const [categories, setCategories] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { edgestore } = useEdgeStore();
  
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    category: '',
    tags: '',
    file: null as File | null
  });
  
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    tags: ''
  });

  useEffect(() => {
    loadImages();
    loadCategories();
    loadTags();
    loadCurrentUser();
  }, []);

  useEffect(() => {
    filterImages();
  }, [images, searchTerm, selectedCategory, selectedTags]);

  useEffect(() => {
    if (currentUser) {
      loadUserFavorites();
    }
  }, [currentUser, images]);

  const loadCurrentUser = async () => {
    const user = await getCurrentUser();
    setCurrentUser(user);
  };

  const loadUserFavorites = async () => {
    if (!currentUser) return;
    
    try {
      const favoriteStatuses = await Promise.all(
        images.map(async (image) => {
          const isFav = await isFavorite('gallery', image.id);
          return { id: image.id, isFavorite: isFav };
        })
      );
      
      const favoriteIds = new Set(
        favoriteStatuses
          .filter(status => status.isFavorite)
          .map(status => status.id)
      );
      
      setFavoriteImages(favoriteIds);
    } catch (error) {
      console.error('Error loading user favorites:', error);
    }
  };

  const loadImages = async () => {
    try {
      setLoading(true);
      const galleryImages = await getGalleryImages(true); // Exclude album images
      setImages(galleryImages);
    } catch (error) {
      console.error('Error loading images:', error);
      setMessage('Có lỗi xảy ra khi tải ảnh');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await getGalleryCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadTags = async () => {
    try {
      const tags = await getGalleryTags();
      setAllTags(tags);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const filterImages = () => {
    let filtered = images;

    if (searchTerm) {
      filtered = filtered.filter(img =>
        img.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        img.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (img.description && img.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(img => img.category === selectedCategory);
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter(img =>
        selectedTags.every(tag => img.tags.includes(tag))
      );
    }

    setFilteredImages(filtered);
  };

  const handleLike = async (imageId: string) => {
    const isLiked = likedImages.has(imageId);
    
    try {
      const success = await updateImageLikes(imageId, !isLiked);
      if (success) {
        setLikedImages(prev => {
          const newLiked = new Set(prev);
          if (isLiked) {
            newLiked.delete(imageId);
          } else {
            newLiked.add(imageId);
          }
          return newLiked;
        });

        // Update local state
        setImages(prev => prev.map(img =>
          img.id === imageId
            ? { ...img, likes: isLiked ? img.likes - 1 : img.likes + 1 }
            : img
        ));
      }
    } catch (error) {
      console.error('Error updating likes:', error);
    }
  };

  const handleFavorite = async (imageId: string) => {
    if (!currentUser) return;
    
    try {
      const isCurrentlyFavorite = favoriteImages.has(imageId);
      
      if (isCurrentlyFavorite) {
        const success = await removeFromFavorites('gallery', imageId);
        if (success) {
          setFavoriteImages(prev => {
            const newFavorites = new Set(prev);
            newFavorites.delete(imageId);
            return newFavorites;
          });
        }
      } else {
        const success = await addToFavorites('gallery', imageId);
        if (success) {
          setFavoriteImages(prev => {
            const newFavorites = new Set(prev);
            newFavorites.add(imageId);
            return newFavorites;
          });
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleDownload = async (imageUrl: string, imageName: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${imageName}.jpg`;
      document.body.appendChild(link);
      link.click(); 
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      setMessage('Lỗi khi tải ảnh về');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const validateFile = async (file: File): Promise<string | null> => {
    if (!file.type.startsWith('image/')) {
      return 'Vui lòng chọn file ảnh hợp lệ';
    }

    if (!isFileSizeValid(file)) {
      return `Kích thước file không được vượt quá ${formatBytes(MAX_FILE_SIZE)}`;
    }

    return null;
  };

  const handleUpload = async () => {
    if (!uploadData.file || !uploadData.title) return;

    const validationError = await validateFile(uploadData.file);
    if (validationError) {
      setMessage(validationError);
      setTimeout(() => setMessage(''), 5000);
      return;
    }

    try {
      setLoading(true);

      // Upload to EdgeStore
      const res = await edgestore.images.upload({
        file: uploadData.file,
        onProgressChange: (progress: number) => {
          if (progress === 100) {
            setLoading(false);
          }
        },
      });

      // Create gallery image in database
ryImage({
        url: res.url,
        title: uploadData.title,
        description: 
        category: uploadData.cated',
        tags: uploadData.tags.split(',').maplean),
        size: uploadData.file.size
      });

      if 
ata
        await loadIma();
        await loadCategories();
        await loadTags();

        setUploadData({
 '',
          description: 
          category: ',
          tags: '',
          file: null,
        });
        setShowUpload);
        set!');
        setTimeout(() => setMessage
      } else {
        setMessage('Có lỗi xảy ra khi lưu thông
      }
    } catch (error) {
      c);
      setMessage('Lỗi;
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  co {
age);
    setEditData({
      title: image.title,
      description '',
      tags: image.tags.jo ')
    });
  };

  co{
rn;

    try {
{
        title,
        description: editData.description,
        tags: editData.tags.spn)
      });

      if {

        await loadImages();
        await loadTags();

        setEditingImage(n

        setMessage('Ảnh đã đượ
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Có lỗi xảy ra khi cập nhật ảnh');
      }
    } catch (error) {
      cr);
      setMessage('Có 
    }
  };

  co

    if (!imageToDelete) return;

    try {
);
      
      // Delete from EdRL
      ) {
        try {
          console.log('Attempting to delete from EdgeStore:', imageToDelete.url);
          awalete({
            url: imageToDelete.url,
          });
          console.log('Successfullye');
        } cat) {
          console.warn('EdgeStore deletion failed (this is OK);
        }
      }

      /e
d);
      if (success) {
a
        await loadImages();
        await loadCategories();
        await loadTa;

        setSelectedImage(nu
        setMessage('Ảnh đã được');
        setTimeout(() => 0);
lse {
        setMessage('Có lỗi xảy  ảnh');
      }
    } catch (error: any) {
      console., error);
      setMessage(`Lỗi khi xóa ảnh: ${error.messa'}`);
      s3000);
    } finally {
      setLoading(false);
    }
  };

  const handleTagClick =g) => {
    i
    g]);

  };

  const removeSelectedTag = (tag: string) => {
    s);
  };

  const handleFileSelect = (e: React.ChangeEve
    const file = e.target.files?.[0];
    ;

    if (!file.type.startsWith('image/')) {
      setMessage('Vui lòng chọn file );
      setTimeout(() =>, 3000);
rn;
    }

    if (!isFileSizeValid(file)) {
      setMessE)}`);
     000);
turn;
    }

    setUploadData(prev => ({ ...prev, file })
  };

;

  re(
">
      <div className="pt-20 pb-16">
">
          }
          <div className="text-center mb-12 bg-/50">
            <h1 className="font-cor">
              Thư viện & Album
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Khám phá bộ sưu tập những khoảnh khắc đẹp nhất và tạo album để tổ 
            </p>
          </div>

          {/* Tabs */}
          <Tabs 
            <div">
ls-2">
                <TabsTgger>
                <TabsTrigger value="albums">Quản lý Album</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="images">
              {/* Success
              {mes
`}>
                  {message.includes('Lỗi? (


                    <CheckCircle classNa00" />
                  )}
                  <AlertDescription className={message.includes('Lỗi') || message.includes('không được') || message.includes('Không đủ') ? 'text-red-700' : 'text-green-700'}>
                    {message}
                  </AlertDescription>
                </Aert>
              )}

              {/* Upload Button */}
              <div classN">
                <Dialog open={sho>
                  <Dld>
            on 

                    >
                      <Upload className="h-4 w-4 mr-
                      Tải ảnh lên
                    </Button>
                  </Dialr>
                  <DialogContent className="max-w-md">
                 der>
                      <DialogTitle className="font-co">
                        Tải ả lên
                      </Dle>
                    </DialogHe
                    <div className="space-y-4">
                      {/* File}
                      <Alert className="border-blue-200 bg-blue-50">
                        <FileIm0" />
                        <AlertDe">
                          <stro mỗi ảnh
                        </AlertDescription>
                      </Alert>

                      <div>
                        <Label htmlFor="upload-file">Chọn ảnh</L
                        <Input
                          id="upload-file"
                          e"

                       elect}
                          className="mt-1"
                        />
                        {uploadData.fi
                          <p clasmt-1">
                            Kích thướcze)}
                          </p>
                        )}
                      
                      <div>
                        <Label htmlFor="upload-title">Tiêu đề *</Label>
                        <Input
                          itle"
                      a.title}
                        { 
                       v, 
                            title: e.target.value 
                          }
                          placeholder="h"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Lel>
                        <Textarea
                          id="upload-dription"
                      
                        
                       ev, 
                            description: e.target.value 
                          }))}
                          placeholder="Mô tả .."
                          className="mt-1"
                          rows={3}
                        />
                      </div>
                      <div
                        <Label htmlFor="upload-categoryc</Label>
                        <Select 
                          valuategory} 
                      > ({ 
                        .prev, 
                       e 
                          }))}
                        >
                          <SelectTrigger className">
                            <SelectValue placeholder="Chọn danh mục" />
                          </Selec
                          <SelectContent
                          Item>
                     
                            <SelectItem value="urban">>
                            <SelectItem value="lifestyle">Lifestyle
                            <SelectItetItem>
                            <SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="upload-tags">Thẻ (phân cách bằng dấul>
                        <Input
                          id="upload-t"
                          val
                        v => ({ 
                        
                            tags: e.target.value 
                          }))}
                          placeholder=
                          className="mt-1"
                        />
                      </div>
                      <div className="flex ga">
                        <B
                          onClick={handleUpload}
                          disabled={!uding}
                      
                        
                          <Camera className="h-4 w-
                          {llên'}
                        </Button>
                        <Button 
                          variant="outline" 
                     e)}
                          className="flex-1"
                          disabled={loading}
                        >
                          Hủy
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Filter
              <div cla
                <div className>
                  <di
                
ut
                      pla."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.targetue)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSel>
                    <SelectTrigger cmd:w-48">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue 
                  igger>
                    ntent>
                      {categoriesWithAll.map(category => (
                        <SelectItem key={category} value={gory}>
                          {category === 'all' ? 'Tất gory}
                        </SelectItem>
                      ))}
                    </SelectCont>
                  </Select>
                </div>

                {/* Selected Tags*/}
                {sele0 && (
                  <div className
                    <sp:</span>
                  
Badge 
                        key={tag} 
                        variant="secondar" 
                        className="cursor-pointer ho0"
                        onClick={() => removeSelectedTag(tag)}
                      >
                        {tag}
                        <X cla
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Popular Tags */}
                {allTags.l
                  <2">
                    >
              (
dge 
                        key={tag} 
                        variant="outine" 
                        className="cursor-pointer ho]"
                        onClick={() => handleTagClick(tag)}
                      >
                        <
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Gallery }
              {load
                <div">
              
                >
..
                  </div>
                </div>
              ) : filteredImages.length > 0 ? 
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:gr>
                  {filteredImages.map((image) => (
                    <div 
                    e.id}
                  
                    >
                      <div className="relative aspect-square overflow-hidden">
                        <Image
                     .url}
                          alt={iitle}
                          fill
                 vw, 25vw"
                          className="object-cover transition-transform dur
                        />
                        
                        {/* Overlay */}
                        <d>
                          <div className="flex gap-2">
                            <Button
                      "
                    dary"
                              onClie)}
                              className="bg-white/90 hover:bg-white"
                            >
                              <>
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                         )}
                              className={`bg-white/90
                                l00' : ''
                              }`}
                            >
                              <Heart classNam>
                            </Button>
                            <Button
                              size="sm"
                             
                         )}
                              disabled={!currentUser}
                              cla
                               '
                              }`}
                            >
                              <Star className={`h-4 w-4 ${favorite
                            </Button>
                            <Button
                              size="sm"
                             ondary"
                         e)}
                              className="bg-white/90 hover:bg-white"
                            >
                              < />
                            </Button>
                            {currentUser && c && (
                              <>
                                <Button
                         ="sm"
                                  variant="secondary"
                                 }
                                  className="bg-white/90 hover:bg-white"
                            
                                  <>
                                </Butto
                                <Button
                                  size="sm"
                                  variant="secondary"
                             
                                  className="bg-white/90 hod-600"
                                >
                                  <
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Favorite  */}
                        {favoid) && (
                          >
                            
                          
   )}
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h3 3>
                      && (
                        >
ion}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1 mb-2">
                          {image.tags.slice => (
                            <Badge 
                              key={tag} 
                          
                      20"
                              onClick={() => handleTagClick(tag}
                            >
                              {}
                            </Badge>
                          ))}
                          {image.tags.length > 2 && (
                            <Badge variant="outline" classNamtext-xs">
                         
                            </Bge>
                          )}
                        <iv>
                        <div className="flex item
                          <div className="flex items-center gap-3">
                            <div className="flex i
                              <sn>
                        div>
                          -1">
                              <Heart className="h-3 w-3" />
                              <span>{image.likes}</span>
                            </div>
                          </div>
                          <div-2">
                            {favoriteImages.has(image.id) && (
                              <Star className="h-3 w-3 t" />
                            )}
                          </div>
                        </di
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Empty State */
                <div cla
                  <div
                 o mb-6">
                  8]" />
               
                    <h3 class">
                      {searchTerm || selectedCa 0
                        ? 'Không tìm thấy ảnh nào'
                        : 'Chưa có ảnh nào'
                      }
                    </
                    <p className="text-muted-foreground mb-6">
                      {searchTerm || selectedCategory !== 'all' || selectedTags.length0
                        ? 'Thử thay đổi bộ lọc'
                        : 'Hãy bắt đầu  bạn'
                      }
                    <
                    {!searchTerm && selectedCategory === '(
                      <Button 
                        onClick={() => setShowUploadDialog(true)}
                        className="bg-[#93E1D8] hover:bg-[#93E1D8]/90 text-white px--full"
                   
                    2" />
                        Tải ảnh đầu tiên
                      </Bu
                    )}
                  </div>
                </d>
              )}

              {/* Loading *
              {loa (
                <div-8">
                  
            v>
.
                  </div>
                </div>
              )}

              {/* Image Modal */}
              <Dialog open={!
                <Dia
                  
            4">
r>
                        <Dial">
                          {selectedImage.title}
                        </DialogTitle>
                      </DialogHear>
                      <div className="relat
                        <Image
                          src={selectedImage.url}
                          alt={selectedImagle}
                          fill
                          sizes="vw"
                          className="object-contain"
                        />
                      </div>
                      {selectedImage.description && (
                        <p/p>
                      )}
                      <div className="flex flex-">
                      
                        >
                            {tag}
                          </Badge>
                    ))}
                      </div>
                      <div className="flex items-cen
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <sp>
                          <div">
                       
                        n>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            }
                          
                          >
                            <
                            {likedImages.'Thích'}
                          </Butto>
                          <Button
                            variant="outline"
                       "
                            onClick={() => handleFavorite(selectedImage.id)}
                            disabled={!currentUser}
                            cla''}
                          >
                            <Star classNa>
                            {favoưu'}
                          </Button>
                          <Button
                            variant="outline"
                       
                            onClick={() => handleDownload(selectedImage.url, selectedImage.title)}
                          >
                            <Do>
                            Tvề
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </DialogConten
              </Dialog>

              {/* Edit Ml */}
              <Dialog 
                
                  <DialogHeader>
                   
h
                    </Dialoge>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="edit-title">Tiêu đề</Label>
                      <Input
                        id="ed
                        value}
                        onChange={(e) => 
                     "
                      />
                    </di
                    <div>
                      <Label htmlFor="editLabel>
                      <Textarea
                        id="edit-des
                    
                      
                     
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-tags">Thẻ (phân cách bằng dấu phẩy)</Label>
                      <Input
                        id="tags"
                    
                      lue }))}
                     mt-1"
                      />
                    </di
                    <div className>
                      <Button onClick={ha>
                        <Save className="h-4 w-4 mr-2" />
                        Lưu
                    on>
                      
                        Hủy
                      </Button>
                    </div>
                  </div>
                </DialogCon
              </Dialog>

              {/* Delete Coal */}
              <Dialog }>
                <Diaw-md">
                  <DialogHeader>
                   ed-600">

                    </DialogTitle>
                  </DialogHeader>
                  {deleteConfirmStep && (
                    <div clae-y-4">
                      {deleteConfirmStep.step === 1 ? (
                        <>
                          <p cround">
                            B"?
                          </p>
                          <div className="f
                            <Button
                      ive"
                              onClick={() => setDeleteConfi
                              className="flex-1"
                          >
                              Xóa
                            </B>
                            <Button variant="ou>
                              Hủy
                            </Button>
                         div>
                        </>
                      ) : (
                        <>
                          <Al>
                            <Aler
                            ">
                       
                       ption>
                      ert>
                          <p className="text-muted-foreground">
                            Nhập "XÓA" để xác nhận xóa ảnh này:
                          </p>
                          <Input
                            placeholder="Nh nhận"
                            on {
                              if (e.target.value === 'XÓA') {
                                handleDelete(deleteConfirmS;
                          null);
                            
                            }}
                          />
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={() => ">
                              Hủy
                           
                          /div>
                        >
                      )}
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </TabsContent>

            <TabsConte
              <A
            </TabsContent>
          </Tabs>
        </iv>
      </div>

  );
}

export default fu
  return (
    <AuthGuard>
      <Navar />
    
 >
uthGuard>
  );
}