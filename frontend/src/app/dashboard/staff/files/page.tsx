'use client';

import { motion } from 'framer-motion';
import {
  FolderOpen,
  Upload,
  Search,
  File,
  FileText,
  FileImage,
  FileSpreadsheet,
  Download,
  MoreVertical,
  Folder,
  Eye,
  Trash2,
  Share2,
  Clock,
  Grid,
  List,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Mock data
const folders = [
  { id: '1', name: 'Sales Documents', files: 24, size: '156 MB', color: 'bg-blue-500' },
  { id: '2', name: 'Property Listings', files: 18, size: '342 MB', color: 'bg-green-500' },
  { id: '3', name: 'Contracts & Legal', files: 12, size: '89 MB', color: 'bg-purple-500' },
  { id: '4', name: 'Team Resources', files: 8, size: '45 MB', color: 'bg-yellow-500' },
];

const recentFiles = [
  { id: '1', name: 'Q4 Sales Report.xlsx', type: 'spreadsheet', size: '2.4 MB', uploadedBy: 'Sarah Johnson', date: '2026-01-28', channel: '#sales-team' },
  { id: '2', name: 'Property Photos - Lekki.zip', type: 'archive', size: '45 MB', uploadedBy: 'Michael Chen', date: '2026-01-27', channel: '#lekki-project' },
  { id: '3', name: 'Client Contract Draft.pdf', type: 'pdf', size: '1.2 MB', uploadedBy: 'Emily Davis', date: '2026-01-27', channel: '#sales-team' },
  { id: '4', name: 'Commission Structure 2026.pdf', type: 'pdf', size: '890 KB', uploadedBy: 'Lisa Brown', date: '2026-01-26', channel: '#announcements' },
  { id: '5', name: 'Team Meeting Notes.docx', type: 'document', size: '340 KB', uploadedBy: 'James Wilson', date: '2026-01-25', channel: '#general' },
  { id: '6', name: 'Property Valuation Template.xlsx', type: 'spreadsheet', size: '1.1 MB', uploadedBy: 'David Okonkwo', date: '2026-01-24', channel: '#sales-team' },
];

const getFileIcon = (type: string) => {
  switch (type) {
    case 'pdf':
    case 'document':
      return <FileText className="w-8 h-8 text-red-500" />;
    case 'spreadsheet':
      return <FileSpreadsheet className="w-8 h-8 text-green-500" />;
    case 'image':
      return <FileImage className="w-8 h-8 text-blue-500" />;
    default:
      return <File className="w-8 h-8 text-gray-500" />;
  }
};

export default function FilesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Shared Files</h1>
          <p className="text-muted-foreground">Access and manage team files and documents</p>
        </div>
        <div className="flex gap-2">
          <Button className="gap-2">
            <Upload className="w-4 h-4" />
            Upload File
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search files and folders..." className="pl-9" />
      </div>

      {/* Folders */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Folders</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {folders.map((folder, index) => (
            <motion.div
              key={folder.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg ${folder.color} flex items-center justify-center`}>
                      <Folder className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{folder.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {folder.files} files • {folder.size}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Files */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Recent Files
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  {getFileIcon(file.type)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{file.uploadedBy}</span>
                      <span>•</span>
                      <span>{file.date}</span>
                      <span>•</span>
                      <span>{file.size}</span>
                      {file.channel && (
                        <>
                          <span>•</span>
                          <Badge variant="secondary" className="text-xs">{file.channel}</Badge>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Download className="w-4 h-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem><Eye className="w-4 h-4 mr-2" /> Preview</DropdownMenuItem>
                        <DropdownMenuItem><Download className="w-4 h-4 mr-2" /> Download</DropdownMenuItem>
                        <DropdownMenuItem><Share2 className="w-4 h-4 mr-2" /> Share</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600"><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
