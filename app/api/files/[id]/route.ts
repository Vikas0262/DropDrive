import dbConnect from "@/lib/db/mongodb";
import File from "@/models/File";
import { ObjectId } from "mongodb";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;
    const userId = request.headers.get('x-user-id');

    // Validate if id is a valid MongoDB ObjectId
    if (!ObjectId.isValid(id)) {
      return new Response(JSON.stringify({ error: "Invalid file ID" }), {
        status: 400,
      });
    }

    const file = await File.findById(new ObjectId(id));

    if (!file) {
      return new Response(JSON.stringify({ error: "File not found" }), {
        status: 404,
      });
    }

    // Check authorization - user must own the file
    if (userId && file.userId.toString() !== userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
      });
    }

    return new Response(JSON.stringify({
      _id: file._id.toString(),
      fileName: file.fileName,
      fileType: file.fileType,
      fileSize: file.fileSize,
      isFolder: file.isFolder,
      folderId: file.folderId ? file.folderId.toString() : null,
      uploadTime: file.uploadTime,
      lastModified: file.lastModified,
      starred: file.starred,
      sharedWith: file.sharedWith.length,
      fileUrl: file.fileUrl,
      isDeleted: file.isDeleted,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching file:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch file" }),
      { status: 500 }
    );
  }
}
