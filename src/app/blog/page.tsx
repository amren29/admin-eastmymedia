'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, Search, FileText } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { format } from 'date-fns';

interface BlogPost {
    id: string;
    title: string;
    slug: string;
    author: string;
    date: string;
    category: string;
    image: string;
    status: 'published' | 'draft';
}

export default function BlogListPage() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const q = query(collection(db, 'posts'), orderBy('date', 'desc'));
            const querySnapshot = await getDocs(q);
            const postsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as BlogPost[];
            setPosts(postsData);
        } catch (error) {
            console.error("Error fetching posts:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this post?')) {
            try {
                await deleteDoc(doc(db, 'posts', id));
                fetchPosts();
            } catch (error) {
                console.error("Error deleting post:", error);
            }
        }
    };

    const filteredPosts = posts.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.author.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Blog Posts</h1>
                    <p className="text-slate-500 mt-1">Manage your blog content</p>
                </div>
                <Link href="/blog/new">
                    <Button className="bg-teal-600 hover:bg-teal-700">
                        <Plus className="h-4 w-4 mr-2" />
                        New Post
                    </Button>
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search posts..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-white"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[400px]">Title</TableHead>
                                <TableHead>Author</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                                        Loading posts...
                                    </TableCell>
                                </TableRow>
                            ) : filteredPosts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <FileText className="h-12 w-12 text-slate-300 mb-3" />
                                            <p className="text-lg font-medium text-slate-900">No posts found</p>
                                            <p className="text-sm text-slate-500">Get started by creating your first blog post.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPosts.map((post) => (
                                    <TableRow key={post.id} className="hover:bg-slate-50/50">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                {post.image && (
                                                    <img
                                                        src={post.image}
                                                        alt={post.title}
                                                        className="h-10 w-16 object-cover rounded border border-slate-200"
                                                    />
                                                )}
                                                <div>
                                                    <div className="font-medium text-slate-900">{post.title}</div>
                                                    <div className="text-xs text-slate-500 truncate max-w-[250px]">/{post.slug}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{post.author}</TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                                {post.category}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-slate-600">
                                            {format(new Date(post.date), 'MMM d, yyyy')}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${post.status === 'published'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {post.status === 'published' ? 'Published' : 'Draft'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/blog/${post.id}`}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-teal-600 hover:bg-teal-50">
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => handleDelete(post.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
