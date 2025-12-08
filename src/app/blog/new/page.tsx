'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Loader2, Upload, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CategoryPicker } from "@/components/CategoryPicker";
import { FormattingHelp } from '@/components/FormattingHelp';

export default function NewBlogPostPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        author: 'Jason',
        date: new Date().toISOString().split('T')[0],
        category: 'Industry Insights',
        image: '',
        status: 'published'
    });

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const title = e.target.value;
        // Auto-generate slug from title
        const slug = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');

        setFormData(prev => ({ ...prev, title, slug }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            // Create a reference to the file in Firebase Storage
            const storageRef = ref(storage, `blog/${Date.now()}_${file.name}`);

            // Upload the file
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    // You can handle progress here if needed
                },
                (error) => {
                    console.error("Upload error:", error);
                    setUploading(false);
                },
                async () => {
                    // Upload completed successfully, get download URL
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    setFormData(prev => ({ ...prev, image: downloadURL }));
                    setUploading(false);
                }
            );
        } catch (error) {
            console.error("Error uploading image:", error);
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await addDoc(collection(db, 'posts'), {
                ...formData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            router.push('/blog');
        } catch (error) {
            console.error("Error creating post:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/blog">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">New Blog Post</h1>
                    <p className="text-slate-500 mt-1">Create a new article for your blog</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={handleTitleChange}
                                placeholder="Enter post title"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="slug">Slug</Label>
                            <Input
                                id="slug"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                placeholder="url-friendly-slug"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="excerpt">Excerpt</Label>
                        <Textarea
                            id="excerpt"
                            value={formData.excerpt}
                            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                            placeholder="Brief summary for the card view..."
                            className="h-20"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Label htmlFor="content">Content (Markdown supported)</Label>
                            <FormattingHelp />
                        </div>
                        <Textarea
                            id="content"
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            placeholder="Write your article content here..."
                            className="h-96 font-mono text-sm"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="author">Author</Label>
                            <Input
                                id="author"
                                value={formData.author}
                                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="date">Date</Label>
                            <Input
                                id="date"
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <CategoryPicker
                                value={formData.category}
                                onChange={(value) => setFormData({ ...formData, category: value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value) => setFormData({ ...formData, status: value as 'published' | 'draft' })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="published">Published</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Label>Cover Image</Label>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="image-url" className="text-xs text-slate-500">Image URL</Label>
                                <Input
                                    id="image-url"
                                    value={formData.image}
                                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                    placeholder="https://..."
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="image-upload" className="text-xs text-slate-500">Or Upload Image</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        id="image-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="cursor-pointer"
                                        disabled={uploading}
                                    />
                                    {uploading && <Loader2 className="h-4 w-4 animate-spin text-teal-600" />}
                                </div>
                            </div>
                        </div>

                        {formData.image ? (
                            <div className="mt-2 relative h-48 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 group">
                                <img
                                    src={formData.image}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <p className="text-white font-medium text-sm flex items-center gap-2">
                                        <ImageIcon className="h-4 w-4" />
                                        Current Cover Image
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="h-48 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                                <ImageIcon className="h-8 w-8 mb-2 opacity-50" />
                                <span className="text-sm">No image selected</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <Link href="/blog">
                        <Button variant="outline" type="button">Cancel</Button>
                    </Link>
                    <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Create Post
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
