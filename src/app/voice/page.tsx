// app/voice/page.tsx
import VoiceAssistant from '@/components/VoiceAssistant';

export default function VoiceAssistantPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Voice Assistant</h1>
          <p className="text-lg text-gray-600">
            Control your task management system with voice commands
          </p>
        </div>
        
        <VoiceAssistant />
        
        <div className="mt-12 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Voice Command Guide</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-lg text-gray-700 mb-2">Task Management</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• "Create a task called [name]"</li>
                <li>• "Show me all my tasks"</li>
                <li>• "Update task [id] to [status]"</li>
                <li>• "Assign task [id] to [name]"</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg text-gray-700 mb-2">Project Management</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• "Create a new project called [name]"</li>
                <li>• "Show me all projects"</li>
                <li>• "Add task [id] to project [name]"</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg text-gray-700 mb-2">Team Management</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• "Create a team called [name]"</li>
                <li>• "Invite [email] to team [name]"</li>
                <li>• "Show me all teams"</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg text-gray-700 mb-2">Analytics & Reports</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• "Show my analytics"</li>
                <li>• "How many tasks did I complete this week?"</li>
                <li>• "Show team productivity report"</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}