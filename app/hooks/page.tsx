"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  TrashIcon, 
  CopyIcon, 
  PlusIcon, 
  DownloadIcon, 
  UploadIcon, 
  SaveIcon,
  FileIcon,
  FolderOpenIcon,
  EditIcon,
  FileTextIcon
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface Hook {
  id: string;
  content: string;
  index: number;
}

interface HookFile {
  id: string;
  name: string;
  hooks: Hook[];
  createdAt: Date;
  updatedAt: Date;
}

export default function HooksPage() {
  const { user } = useAuth();
  const [hookFiles, setHookFiles] = useState<HookFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<HookFile | null>(null);
  const [currentHook, setCurrentHook] = useState("");
  const [currentHookIndex, setCurrentHookIndex] = useState(0);
  const [newFileName, setNewFileName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreatingNewFile, setIsCreatingNewFile] = useState(false);
  const [editingFileName, setEditingFileName] = useState<string | null>(null);

  // Load hook files from localStorage first, then try Supabase
  useEffect(() => {
    // Load from localStorage first
    const savedFiles = localStorage.getItem("hookFiles");
    if (savedFiles) {
      try {
        const parsedFiles = JSON.parse(savedFiles);
        setHookFiles(parsedFiles);
      } catch (error) {
        console.error("Error loading local files:", error);
      }
    }
    
    // Then try to load from Supabase if user is logged in
    if (user) {
      loadHookFiles();
    }
  }, [user]);

  const loadHookFiles = async () => {
    if (!user) return;

    try {
      const { data: files, error } = await supabase
        .from("hook_files")
        .select(`
          *,
          hooks (*)
        `)
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error loading hook files from Supabase:", error);
        // Don't show error toast if tables don't exist yet
        if (!error.message?.includes("relation") && !error.message?.includes("does not exist")) {
          toast.error("Failed to load hook files from cloud");
        }
        return;
      }

      const formattedFiles: HookFile[] = (files || []).map(file => ({
        id: file.id,
        name: file.file_name,
        hooks: (file.hooks || []).map((hook: any, index: number) => ({
          id: hook.id,
          content: hook.content,
          index: index
        })),
        createdAt: new Date(file.created_at),
        updatedAt: new Date(file.updated_at)
      }));

      setHookFiles(formattedFiles);
    } catch (error) {
      console.error("Supabase connection error:", error);
    }
  };

  // Save to localStorage whenever hookFiles change
  useEffect(() => {
    if (hookFiles.length > 0) {
      localStorage.setItem("hookFiles", JSON.stringify(hookFiles));
    }
  }, [hookFiles]);

  // Load hooks from a text file
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      const hooks = content.split("\n\n").filter(h => h.trim());
      
      // Suggest file name from uploaded file
      const suggestedName = file.name.replace(/\.[^/.]+$/, "");
      setNewFileName(suggestedName);
      
      // Create new file with hooks
      const newFile: HookFile = {
        id: Date.now().toString(),
        name: suggestedName,
        hooks: hooks.map((h, i) => ({
          id: Date.now().toString() + "_" + i,
          content: h.trim(),
          index: i
        })),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setSelectedFile(newFile);
      setCurrentHookIndex(0);
      setCurrentHook(newFile.hooks[0]?.content || "");
      setIsCreatingNewFile(true);
      
      toast.success(`Loaded ${hooks.length} hooks from ${file.name}`);
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  // Save current hook to file
  const saveToFile = async () => {
    if (!selectedFile) {
      toast.error("Please select or create a file first");
      return;
    }

    // Save current hook before saving file
    const updatedHooks = [...selectedFile.hooks];
    updatedHooks[currentHookIndex] = {
      ...updatedHooks[currentHookIndex],
      content: currentHook
    };
    
    const updatedFile = {
      ...selectedFile,
      hooks: updatedHooks,
      updatedAt: new Date()
    };

    // Try to save to Supabase if user is logged in
    if (user) {
      try {
        // Check if file exists in database
        let fileId = selectedFile.id;
        
        if (isCreatingNewFile || !fileId.includes('-')) { // Local IDs don't have UUID format
          // Create new file in database
          const { data: newFile, error: fileError } = await supabase
            .from("hook_files")
            .insert({
              user_id: user.id,
              file_name: selectedFile.name
            })
            .select()
            .single();

          if (fileError) {
            console.error("Supabase save error:", fileError);
            // Continue with local save
          } else if (newFile) {
            fileId = newFile.id;
            updatedFile.id = fileId;
            
            // Save hooks to database
            const hooksToSave = updatedFile.hooks.map(hook => ({
              user_id: user.id,
              file_id: fileId,
              file_name: updatedFile.name,
              title: `Hook ${hook.index + 1}`,
              content: hook.content
            }));

            // Delete existing hooks for this file
            await supabase
              .from("hooks")
              .delete()
              .eq("file_id", fileId);

            // Insert new hooks
            const { error: hooksError } = await supabase
              .from("hooks")
              .insert(hooksToSave);

            if (!hooksError) {
              // Update file timestamp
              await supabase
                .from("hook_files")
                .update({ updated_at: new Date().toISOString() })
                .eq("id", fileId);
            }
          }
        }
      } catch (error) {
        console.error("Error saving to Supabase:", error);
      }
    }

    // Always save to localStorage
    const existingFiles = hookFiles.filter(f => f.id !== selectedFile.id);
    const newFiles = [...existingFiles, updatedFile];
    setHookFiles(newFiles);
    setSelectedFile(updatedFile);
    setIsCreatingNewFile(false);
    
    toast.success("Hooks saved successfully!");
  };

  // Download hooks as text file
  const downloadFile = (file: HookFile) => {
    const content = file.hooks.map(h => h.content).join("\n\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${file.name}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${file.name}.txt`);
  };

  // Create new hook file
  const createNewFile = () => {
    if (!newFileName.trim()) {
      toast.error("Please enter a file name");
      return;
    }

    const newFile: HookFile = {
      id: Date.now().toString(),
      name: newFileName.trim(),
      hooks: [{
        id: Date.now().toString() + "_0",
        content: "",
        index: 0
      }],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setSelectedFile(newFile);
    setCurrentHook("");
    setCurrentHookIndex(0);
    setNewFileName("");
    setIsCreatingNewFile(true);
    toast.success(`Created new file: ${newFile.name}`);
  };

  // Add hook to current file
  const addHookToFile = () => {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }

    // Save current hook
    const updatedHooks = [...selectedFile.hooks];
    updatedHooks[currentHookIndex] = {
      ...updatedHooks[currentHookIndex],
      content: currentHook
    };

    // Add new empty hook
    const newHook: Hook = {
      id: Date.now().toString(),
      content: "",
      index: updatedHooks.length
    };

    updatedHooks.push(newHook);
    
    setSelectedFile({
      ...selectedFile,
      hooks: updatedHooks
    });
    
    setCurrentHookIndex(updatedHooks.length - 1);
    setCurrentHook("");
    
    toast.success("Added new hook");
  };

  // Navigate between hooks
  const navigateHook = (direction: "prev" | "next") => {
    if (!selectedFile) return;

    // Save current hook
    const updatedHooks = [...selectedFile.hooks];
    updatedHooks[currentHookIndex] = {
      ...updatedHooks[currentHookIndex],
      content: currentHook
    };
    
    setSelectedFile({
      ...selectedFile,
      hooks: updatedHooks
    });

    // Navigate
    if (direction === "prev" && currentHookIndex > 0) {
      setCurrentHookIndex(currentHookIndex - 1);
      setCurrentHook(updatedHooks[currentHookIndex - 1].content);
    } else if (direction === "next" && currentHookIndex < selectedFile.hooks.length - 1) {
      setCurrentHookIndex(currentHookIndex + 1);
      setCurrentHook(updatedHooks[currentHookIndex + 1].content);
    }
  };

  // Delete current hook
  const deleteCurrentHook = () => {
    if (!selectedFile || selectedFile.hooks.length === 1) {
      toast.error("Cannot delete the last hook in file");
      return;
    }

    const updatedHooks = selectedFile.hooks.filter((_, i) => i !== currentHookIndex);
    
    // Re-index hooks
    updatedHooks.forEach((hook, i) => {
      hook.index = i;
    });
    
    setSelectedFile({
      ...selectedFile,
      hooks: updatedHooks
    });
    
    const newIndex = Math.min(currentHookIndex, updatedHooks.length - 1);
    setCurrentHookIndex(newIndex);
    setCurrentHook(updatedHooks[newIndex].content);
    
    toast.success("Hook deleted");
  };

  // Delete file
  const deleteFile = async (fileId: string) => {
    if (confirm("Are you sure you want to delete this file and all its hooks?")) {
      // Try to delete from Supabase if user is logged in and it's a cloud file
      if (user && fileId.includes('-')) { // UUID format indicates cloud file
        try {
          const { error } = await supabase
            .from("hook_files")
            .delete()
            .eq("id", fileId)
            .eq("user_id", user.id);

          if (error) {
            console.error("Failed to delete from Supabase:", error);
          }
        } catch (error) {
          console.error("Supabase delete error:", error);
        }
      }

      // Always delete from local state and localStorage
      const newFiles = hookFiles.filter(f => f.id !== fileId);
      setHookFiles(newFiles);
      localStorage.setItem("hookFiles", JSON.stringify(newFiles));
      
      if (selectedFile?.id === fileId) {
        setSelectedFile(null);
        setCurrentHook("");
        setCurrentHookIndex(0);
      }
      
      toast.success("File deleted");
    }
  };

  // Rename file
  const renameFile = async (fileId: string, newName: string) => {
    if (!user || !newName.trim()) return;

    const { error } = await supabase
      .from("hook_files")
      .update({ file_name: newName.trim() })
      .eq("id", fileId)
      .eq("user_id", user.id);

    if (error) {
      toast.error("Failed to rename file");
      return;
    }

    toast.success("File renamed");
    setEditingFileName(null);
    loadHookFiles();
    
    if (selectedFile?.id === fileId) {
      setSelectedFile({ ...selectedFile, name: newName.trim() });
    }
  };

  const filteredFiles = hookFiles.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#e5e6e0] dark:bg-[#18181a]">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold dark:text-white">Hooks Manager</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Create, edit and manage hook files
              </p>
            </div>
            <div className="flex gap-3">
              <input
                type="file"
                accept=".txt"
                onChange={handleFileUpload}
                className="hidden"
                id="upload-hooks"
              />
              <label htmlFor="upload-hooks">
                <div
                  className="bg-gray-600 hover:bg-gray-700 text-white cursor-pointer inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <UploadIcon className="w-4 h-4 mr-2" />
                  Load File
                </div>
              </label>
              {selectedFile && (
                <Button
                  onClick={() => downloadFile(selectedFile)}
                  className="bg-gray-600 hover:bg-gray-700 text-white"
                >
                  <DownloadIcon className="w-4 h-4 mr-2" />
                  Download
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar - Files List */}
            <div className="lg:col-span-1 space-y-4">
              {/* New File Section */}
              <div className="bg-[#f3f4ee] dark:bg-[#0e0f15] p-4 rounded-xl shadow-sm">
                <h3 className="font-semibold mb-3 dark:text-white">New File</h3>
                <div className="space-y-2">
                  <Input
                    placeholder="File name..."
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    className="dark:bg-[#18181a] dark:text-white"
                  />
                  <Button
                    onClick={createNewFile}
                    className="w-full bg-[#5465ff] hover:bg-[#5465ff]/90 text-white"
                    size="sm"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Create File
                  </Button>
                </div>
              </div>

              {/* Search */}
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="dark:bg-[#0e0f15] dark:text-white"
              />

              {/* Files List */}
              <div className="bg-[#f3f4ee] dark:bg-[#0e0f15] rounded-xl shadow-sm overflow-hidden">
                <h3 className="font-semibold p-4 pb-2 dark:text-white">Files</h3>
                <div className="max-h-[400px] overflow-y-auto">
                  {filteredFiles.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 p-4 text-sm">
                      No files found
                    </p>
                  ) : (
                    filteredFiles.map((file) => (
                      <div
                        key={file.id}
                        className={`flex items-center justify-between p-3 hover:bg-gray-100 dark:hover:bg-[#18181a] cursor-pointer transition-colors ${
                          selectedFile?.id === file.id ? "bg-[#5465ff]/10 dark:bg-[#5465ff]/20" : ""
                        }`}
                        onClick={() => {
                          setSelectedFile(file);
                          setCurrentHookIndex(0);
                          setCurrentHook(file.hooks[0]?.content || "");
                          setIsCreatingNewFile(false);
                        }}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileTextIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          {editingFileName === file.id ? (
                            <Input
                              value={file.name}
                              onChange={(e) => {
                                const updated = hookFiles.map(f =>
                                  f.id === file.id ? { ...f, name: e.target.value } : f
                                );
                                setHookFiles(updated);
                              }}
                              onBlur={() => renameFile(file.id, file.name)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  renameFile(file.id, file.name);
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="h-6 px-1 text-sm"
                              autoFocus
                            />
                          ) : (
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium dark:text-white truncate">
                                {file.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {file.hooks.length} hooks
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingFileName(file.id);
                            }}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                          >
                            <EditIcon className="w-3 h-3 text-gray-500" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteFile(file.id);
                            }}
                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                          >
                            <TrashIcon className="w-3 h-3 text-red-500" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Main Content - Hook Editor */}
            <div className="lg:col-span-3">
              {selectedFile ? (
                <div className="bg-[#f3f4ee] dark:bg-[#0e0f15] p-6 rounded-xl shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h2 className="text-xl font-semibold dark:text-white">
                        {selectedFile.name}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Hook {currentHookIndex + 1} of {selectedFile.hooks.length}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => navigateHook("prev")}
                        disabled={currentHookIndex === 0}
                        variant="outline"
                        size="sm"
                      >
                        Previous
                      </Button>
                      <Button
                        onClick={() => navigateHook("next")}
                        disabled={currentHookIndex === selectedFile.hooks.length - 1}
                        variant="outline"
                        size="sm"
                      >
                        Next
                      </Button>
                    </div>
                  </div>

                  <Textarea
                    value={currentHook}
                    onChange={(e) => setCurrentHook(e.target.value)}
                    placeholder="Enter hook content..."
                    className="min-h-[300px] mb-4 dark:bg-[#18181a] dark:text-white font-mono"
                    maxLength={500}
                  />

                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {currentHook.length}/500 characters
                    </span>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          navigator.clipboard.writeText(currentHook);
                          toast.success("Hook copied!");
                        }}
                        variant="outline"
                        size="sm"
                      >
                        <CopyIcon className="w-4 h-4 mr-2" />
                        Copy
                      </Button>
                      <Button
                        onClick={deleteCurrentHook}
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:text-red-600"
                      >
                        <TrashIcon className="w-4 h-4 mr-2" />
                        Delete Hook
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={addHookToFile}
                      className="bg-gray-600 hover:bg-gray-700 text-white"
                    >
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Add New Hook
                    </Button>
                    <Button
                      onClick={saveToFile}
                      className="bg-[#5465ff] hover:bg-[#5465ff]/90 text-white"
                    >
                      <SaveIcon className="w-4 h-4 mr-2" />
                      {isCreatingNewFile ? "Save New File" : "Save Changes"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-[#f3f4ee] dark:bg-[#0e0f15] p-12 rounded-xl shadow-sm text-center">
                  <FolderOpenIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Select a file to edit or create a new one
                  </p>
                  <Button
                    onClick={() => document.getElementById("upload-hooks")?.click()}
                    className="bg-[#5465ff] hover:bg-[#5465ff]/90 text-white"
                  >
                    <UploadIcon className="w-4 h-4 mr-2" />
                    Load Hooks from File
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}