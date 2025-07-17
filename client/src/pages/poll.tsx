import FriendVoting from "@/components/FriendVoting";
import { useRoute } from "wouter";

export default function PollPage() {
  // Extract decisionId from the URL
  const [match, params] = useRoute("/poll/:decisionId");
  const decisionId = params?.decisionId ? Number(params.decisionId) : undefined;

  if (!decisionId) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl text-red-500">
        Invalid poll link.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 flex flex-col items-center justify-center py-8 px-2">
      <div className="w-full max-w-lg mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2 text-gradient bg-gradient-to-r from-primary via-fuchsia-500 to-purple-600 bg-clip-text text-transparent">Should I Bunk? - Friend Poll</h1>
          <p className="text-muted-foreground">Vote and help your friend decide!</p>
        </div>
        <FriendVoting decisionId={decisionId} />
      </div>
    </div>
  );
} 