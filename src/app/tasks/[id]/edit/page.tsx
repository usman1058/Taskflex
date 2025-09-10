// app/tasks/[id]/edit/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
    CalendarIcon,
    Save,
    ArrowLeft,
    Loader2,
    User,
    Folder,
    Users,
    Tag,
    AlertCircle
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { UserSearch } from "@/components/ui/user-search"
import { AttachmentUpload } from "@/components/ui/attachment-upload"

interface Task {
    id: string
    title: string
    description: string | null
    type: "TASK" | "BUG" | "STORY" | "EPIC" | "SUBTASK"
    status: "OPEN" | "IN_PROGRESS" | "REVIEW" | "DONE" | "CLOSED" | "CANCELLED"
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
    dueDate: string | null
    createdAt: string
    updatedAt: string
    projectId: string | null
    project: {
        id: string
        name: string
        key: string
    } | null
    teamId: string | null
    team: {
        id: string
        name: string
    } | null
    creatorId: string
    creator: {
        id: string
        name: string | null
        email: string
        avatar: string | null
    }
    assigneeId: string | null
    assignee: {
        id: string
        name: string | null
        email: string
        avatar: string | null
    } | null
    parentTaskId: string | null
    taskTags: {
        tag: {
            id: string
            name: string
            color: string | null
        }
    }[]
    attachments: {
        id: string
        filename: string
        fileSize: number
        mimeType: string
        path: string
    }[]
}

interface Project {
    id: string
    name: string
    key: string
}

interface Team {
    id: string
    name: string
}

interface User {
    id: string
    name: string | null
    email: string
    avatar: string | null
}

interface Tag {
    id: string
    name: string
    color: string | null
}

export default function TaskEditPage() {
    const router = useRouter()
    const params = useParams()
    const { data: session } = useSession()
    const taskId = params.id as string

    const [task, setTask] = useState<Task | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [projects, setProjects] = useState<Project[]>([])
    const [teams, setTeams] = useState<Team[]>([])
    const [users, setUsers] = useState<User[]>([])
    const [tags, setTags] = useState<Tag[]>([])
    const [availableParentTasks, setAvailableParentTasks] = useState<Task[]>([])

    const [selectedTags, setSelectedTags] = useState<string[]>([])
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [attachments, setAttachments] = useState<File[]>([])
    const [uploadingAttachments, setUploadingAttachments] = useState(false)

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        type: "TASK" as Task["type"],
        status: "OPEN" as Task["status"],
        priority: "MEDIUM" as Task["priority"],
        dueDate: null as Date | null,
        projectId: "",
        teamId: "",
        assigneeId: "",
        parentTaskId: ""
    })


    useEffect(() => {
        const fetchData = async () => {
            try {
                // Check if user is authenticated
                if (!session) {
                    setError("You must be signed in to view this task");
                    setLoading(false);
                    return;
                }

                // Fetch task details
                const taskRes = await fetch(`/api/tasks/${taskId}`);
                if (!taskRes.ok) {
                    let errorMessage = "Failed to fetch task";
                    try {
                        const errorData = await taskRes.json();
                        errorMessage = errorData.error || errorMessage;
                        console.error("API Error:", errorData);
                    } catch (e) {
                        errorMessage = `HTTP error! Status: ${taskRes.status}`;
                    }
                    throw new Error(errorMessage);
                }
                const taskData = await taskRes.json();
                setTask(taskData);

                // Set form data
                setFormData({
                    title: taskData.title,
                    description: taskData.description || "",
                    type: taskData.type,
                    status: taskData.status,
                    priority: taskData.priority,
                    dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
                    projectId: taskData.projectId || "",
                    teamId: taskData.teamId || "",
                    assigneeId: taskData.assigneeId || "",
                    parentTaskId: taskData.parentTaskId || ""
                });

                // Set selected user if assignee exists
                if (taskData.assignee) {
                    setSelectedUser(taskData.assignee);
                }

                // Set selected tags
                setSelectedTags(taskData.taskTags?.map((taskTag: any) => taskTag.tag.id) || []);

                // Fetch assignees (users that can be assigned tasks)
                const assigneesResponse = await fetch("/api/assignees");
                if (assigneesResponse.ok) {
                    const assigneesData = await assigneesResponse.json();
                    setUsers(assigneesData);
                } else {
                    console.error("Failed to fetch assignees");
                }

                // Fetch projects
                const projectsRes = await fetch("/api/projects");
                if (projectsRes.ok) {
                    const projectsData = await projectsRes.json();
                    setProjects(projectsData);
                } else {
                    console.error("Failed to fetch projects");
                }

                // Fetch teams
                const teamsRes = await fetch("/api/teams");
                if (teamsRes.ok) {
                    const teamsData = await teamsRes.json();
                    setTeams(teamsData);
                } else {
                    console.error("Failed to fetch teams");
                }

                // Fetch tags
                const tagsRes = await fetch("/api/tags");
                if (tagsRes.ok) {
                    const tagsData = await tagsRes.json();
                    setTags(tagsData);
                } else {
                    console.error("Failed to fetch tags");
                }

                // Fetch available parent tasks
                const parentTasksRes = await fetch("/api/tasks");
                if (parentTasksRes.ok) {
                    const response = await parentTasksRes.json();
                    // The API returns an object with tasks property and pagination info
                    const allTasks = response.tasks || []; // Extract tasks array from response
                    // Filter out the current task to prevent self-parenting
                    const filteredTasks = allTasks.filter((t: Task) => t.id !== taskId);
                    setAvailableParentTasks(filteredTasks);
                } else {
                    console.error("Failed to fetch parent tasks");
                    // If API fails, set empty array to prevent errors
                    setAvailableParentTasks([]);
                }
            } catch (err) {
                console.error("Error fetching data:", err);
                setError(err instanceof Error ? err.message : "Failed to load task data. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        if (taskId) {
            fetchData();
        }
    }, [taskId, session]);

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleTagToggle = (tagId: string) => {
        setSelectedTags(prev =>
            prev.includes(tagId)
                ? prev.filter(id => id !== tagId)
                : [...prev, tagId]
        )
    }

    const handleUserSelect = (user: User) => {
        setSelectedUser(user)
        setFormData(prev => ({ ...prev, assigneeId: user.id }))
    }

    const handleClearUser = () => {
        setSelectedUser(null)
        setFormData(prev => ({ ...prev, assigneeId: "" }))
    }

    const uploadAttachments = async (): Promise<any[]> => {
        if (attachments.length === 0) return []

        setUploadingAttachments(true)
        const uploadedAttachments: any[] = []

        try {
            for (const file of attachments) {
                const formData = new FormData()
                formData.append('file', file)

                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                })

                if (!response.ok) {
                    throw new Error(`Failed to upload ${file.name}`)
                }

                const result = await response.json()
                uploadedAttachments.push(result)
            }
        } catch (error) {
            console.error('Error uploading attachments:', error)
            throw error
        } finally {
            setUploadingAttachments(false)
        }

        return uploadedAttachments
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setError(null)

        try {
            // Upload attachments first
            const uploadedAttachments = await uploadAttachments()

            const payload = {
                ...formData,
                dueDate: formData.dueDate ? formData.dueDate.toISOString() : null,
                projectId: formData.projectId || null, // Convert empty string to null
                teamId: formData.teamId || null,       // Convert empty string to null
                assigneeId: formData.assigneeId || null, // Convert empty string to null
                parentTaskId: formData.parentTaskId || null, // Convert empty string to null
                tags: selectedTags,
                attachments: uploadedAttachments
            }

            const response = await fetch(`/api/tasks/${taskId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            })

            if (!response.ok) {
                const errorData = await response.json()
                console.error("Error response:", errorData); // Log the error response

                // Try to extract more detailed error information
                let errorMessage = "Failed to update task";
                if (errorData.error) {
                    errorMessage = errorData.error;
                } else if (errorData.message) {
                    errorMessage = errorData.message;
                } else if (typeof errorData === 'string') {
                    errorMessage = errorData;
                }

                throw new Error(errorMessage)
            }

            // Redirect to task detail page
            router.push(`/tasks/${taskId}`)
        } catch (err) {
            console.error("Error updating task:", err)
            setError(err instanceof Error ? err.message : "Failed to update task. Please try again.")
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </MainLayout>
        )
    }

    if (error && !task) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <p className="text-destructive text-lg mb-4">{error}</p>
                        <Button onClick={() => router.back()}>Go Back</Button>
                    </div>
                </div>
            </MainLayout>
        )
    }

    return (
        <MainLayout>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Edit Task</h1>
                        <p className="text-muted-foreground">
                            Update task details and information
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-destructive" />
                        <p className="text-destructive">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid gap-6 md:grid-cols-3">
                        <div className="md:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Task Details</CardTitle>
                                    <CardDescription>
                                        Update the basic information about this task
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="title">Title</Label>
                                        <Input
                                            id="title"
                                            value={formData.title}
                                            onChange={(e) => handleInputChange("title", e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            value={formData.description}
                                            onChange={(e) => handleInputChange("description", e.target.value)}
                                            rows={4}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <Label htmlFor="type">Type</Label>
                                            <Select
                                                value={formData.type}
                                                onValueChange={(value) => handleInputChange("type", value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="TASK">Task</SelectItem>
                                                    <SelectItem value="BUG">Bug</SelectItem>
                                                    <SelectItem value="STORY">Story</SelectItem>
                                                    <SelectItem value="EPIC">Epic</SelectItem>
                                                    <SelectItem value="SUBTASK">Subtask</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label htmlFor="status">Status</Label>
                                            <Select
                                                value={formData.status}
                                                onValueChange={(value) => handleInputChange("status", value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="OPEN">Open</SelectItem>
                                                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                                    <SelectItem value="REVIEW">Review</SelectItem>
                                                    <SelectItem value="DONE">Done</SelectItem>
                                                    <SelectItem value="CLOSED">Closed</SelectItem>
                                                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label htmlFor="priority">Priority</Label>
                                            <Select
                                                value={formData.priority}
                                                onValueChange={(value) => handleInputChange("priority", value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select priority" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="LOW">Low</SelectItem>
                                                    <SelectItem value="MEDIUM">Medium</SelectItem>
                                                    <SelectItem value="HIGH">High</SelectItem>
                                                    <SelectItem value="URGENT">Urgent</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div>
                                        <Label>Due Date</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal",
                                                        !formData.dueDate && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {formData.dueDate ? format(formData.dueDate, "PPP") : "Pick a date"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={formData.dueDate ?? undefined}
                                                    onSelect={(date) => handleInputChange("dueDate", date)}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Tags</CardTitle>
                                    <CardDescription>
                                        Add tags to categorize this task
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        {tags.map((tag) => (
                                            <Badge
                                                key={tag.id}
                                                variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                                                className="cursor-pointer"
                                                style={{
                                                    backgroundColor: selectedTags.includes(tag.id) ? tag.color || "" : "",
                                                    borderColor: tag.color || ""
                                                }}
                                                onClick={() => handleTagToggle(tag.id)}
                                            >
                                                {tag.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="h-5 w-5" />
                                        People
                                    </CardTitle>
                                    <CardDescription>
                                        Assign people to this task
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="assignee">Assignee</Label>
                                        <UserSearch
                                            users={users}
                                            selectedUser={selectedUser}
                                            onUserSelect={handleUserSelect}
                                            onClearUser={handleClearUser}
                                        />
                                    </div>
                                    <Separator />
                                    <div>
                                        <Label>Creator</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage src={task?.creator.avatar || ""} />
                                                <AvatarFallback>
                                                    {task?.creator.name?.charAt(0) || task?.creator.email.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span>{task?.creator.name || task?.creator.email}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Folder className="h-5 w-5" />
                                        Project
                                    </CardTitle>
                                    <CardDescription>
                                        Associate this task with a project
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Select
                                        value={formData.projectId || "none"}
                                        onValueChange={(value) => handleInputChange("projectId", value === "none" ? "" : value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select project" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">No Project</SelectItem>
                                            {projects.map((project) => (
                                                <SelectItem key={project.id} value={project.id}>
                                                    {project.name} ({project.key})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="h-5 w-5" />
                                        Team
                                    </CardTitle>
                                    <CardDescription>
                                        Associate this task with a team
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Select
                                        value={formData.teamId || "none"}
                                        onValueChange={(value) => handleInputChange("teamId", value === "none" ? "" : value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select team" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">No Team</SelectItem>
                                            {teams.map((team) => (
                                                <SelectItem key={team.id} value={team.id}>
                                                    {team.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Parent Task</CardTitle>
                                    <CardDescription>
                                        Link this task to a parent task
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Select
                                        value={formData.parentTaskId || "none"}
                                        onValueChange={(value) => handleInputChange("parentTaskId", value === "none" ? "" : value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select parent task" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">No Parent Task</SelectItem>
                                            {availableParentTasks.map((task) => (
                                                <SelectItem key={task.id} value={task.id}>
                                                    {task.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </CardContent>
                            </Card>

                            {/* Attachments */}
                            <AttachmentUpload
                                attachments={attachments}
                                onAttachmentsChange={setAttachments}
                                existingAttachments={task?.attachments || []}
                                uploading={uploadingAttachments}
                            />

                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => router.back()}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={saving || uploadingAttachments}>
                                    {saving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </MainLayout>
    )
}