const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class DocumentStore {
  constructor(dataDir = 'data') {
    this.dataDir = dataDir;
    this.ideasDir = path.join(dataDir, 'ideas');
    this.commentsDir = path.join(dataDir, 'comments');
    this.metaFile = path.join(dataDir, 'meta.json');
    this.init();
  }

  async init() {
    try {
      // Create data directories if they don't exist
      await fs.mkdir(this.dataDir, { recursive: true });
      await fs.mkdir(this.ideasDir, { recursive: true });
      await fs.mkdir(this.commentsDir, { recursive: true });
      
      // Initialize meta file if it doesn't exist
      try {
        await fs.access(this.metaFile);
      } catch {
        await this.saveMeta({ nextId: 1, totalIdeas: 0 });
      }
    } catch (error) {
      console.error('Error initializing document store:', error);
    }
  }

  async getMeta() {
    try {
      const data = await fs.readFile(this.metaFile, 'utf8');
      return JSON.parse(data);
    } catch {
      return { nextId: 1, totalIdeas: 0 };
    }
  }

  async saveMeta(meta) {
    await fs.writeFile(this.metaFile, JSON.stringify(meta, null, 2));
  }

  async saveIdea(idea) {
    const filename = `idea-${idea.id}.json`;
    const filepath = path.join(this.ideasDir, filename);
    await fs.writeFile(filepath, JSON.stringify(idea, null, 2));
    return idea;
  }

  async getIdea(id) {
    try {
      const filename = `idea-${id}.json`;
      const filepath = path.join(this.ideasDir, filename);
      const data = await fs.readFile(filepath, 'utf8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  async getAllIdeas() {
    try {
      const files = await fs.readdir(this.ideasDir);
      const ideaFiles = files.filter(file => file.startsWith('idea-') && file.endsWith('.json'));
      
      const ideas = await Promise.all(
        ideaFiles.map(async (file) => {
          try {
            const filepath = path.join(this.ideasDir, file);
            const data = await fs.readFile(filepath, 'utf8');
            return JSON.parse(data);
          } catch {
            return null;
          }
        })
      );

      return ideas.filter(idea => idea !== null);
    } catch {
      return [];
    }
  }

  async deleteIdea(id) {
    try {
      const filename = `idea-${id}.json`;
      const filepath = path.join(this.ideasDir, filename);
      await fs.unlink(filepath);
      return true;
    } catch {
      return false;
    }
  }

  async getNextId() {
    const meta = await this.getMeta();
    const nextId = meta.nextId;
    await this.saveMeta({ ...meta, nextId: nextId + 1 });
    return nextId;
  }

  async updateTotalCount() {
    const ideas = await this.getAllIdeas();
    const meta = await this.getMeta();
    await this.saveMeta({ ...meta, totalIdeas: ideas.length });
    return ideas.length;
  }

  // ===== COMMENTS METHODS =====

  async saveComment(comment) {
    const filename = `comment-${comment.id}.json`;
    const filepath = path.join(this.commentsDir, filename);
    await fs.writeFile(filepath, JSON.stringify(comment, null, 2));
    return comment;
  }

  async getComment(id) {
    try {
      const filename = `comment-${id}.json`;
      const filepath = path.join(this.commentsDir, filename);
      const data = await fs.readFile(filepath, 'utf8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  async getCommentsForIdea(ideaId) {
    try {
      const files = await fs.readdir(this.commentsDir);
      const commentFiles = files.filter(file => file.startsWith('comment-') && file.endsWith('.json'));
      
      const comments = await Promise.all(
        commentFiles.map(async (file) => {
          try {
            const filepath = path.join(this.commentsDir, file);
            const data = await fs.readFile(filepath, 'utf8');
            const comment = JSON.parse(data);
            return comment.ideaId === ideaId && !comment.isDeleted ? comment : null;
          } catch {
            return null;
          }
        })
      );

      const validComments = comments.filter(comment => comment !== null);
      
      // Sort by creation date (newest first)
      return validComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch {
      return [];
    }
  }

  async getAllComments() {
    try {
      const files = await fs.readdir(this.commentsDir);
      const commentFiles = files.filter(file => file.startsWith('comment-') && file.endsWith('.json'));
      
      const comments = await Promise.all(
        commentFiles.map(async (file) => {
          try {
            const filepath = path.join(this.commentsDir, file);
            const data = await fs.readFile(filepath, 'utf8');
            const comment = JSON.parse(data);
            return !comment.isDeleted ? comment : null;
          } catch {
            return null;
          }
        })
      );

      const validComments = comments.filter(comment => comment !== null);
      
      // Sort by creation date (newest first)
      return validComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch {
      return [];
    }
  }

  async deleteComment(id) {
    try {
      // Soft delete - mark as deleted instead of removing file
      const comment = await this.getComment(id);
      if (comment) {
        comment.isDeleted = true;
        comment.updatedAt = new Date().toISOString();
        await this.saveComment(comment);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async updateComment(id, updates) {
    try {
      const comment = await this.getComment(id);
      if (comment && !comment.isDeleted) {
        const updatedComment = {
          ...comment,
          ...updates,
          updatedAt: new Date().toISOString()
        };
        await this.saveComment(updatedComment);
        return updatedComment;
      }
      return null;
    } catch {
      return null;
    }
  }

  async createComment(commentData) {
    const comment = {
      id: uuidv4(),
      ideaId: commentData.ideaId,
      parentId: commentData.parentId || null,
      authorName: commentData.authorName,
      authorEmail: commentData.authorEmail,
      content: commentData.content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isModerated: false,
      isDeleted: false
    };

    await this.saveComment(comment);
    return comment;
  }

  async getCommentReplies(parentId) {
    try {
      const files = await fs.readdir(this.commentsDir);
      const commentFiles = files.filter(file => file.startsWith('comment-') && file.endsWith('.json'));
      
      const replies = await Promise.all(
        commentFiles.map(async (file) => {
          try {
            const filepath = path.join(this.commentsDir, file);
            const data = await fs.readFile(filepath, 'utf8');
            const comment = JSON.parse(data);
            return comment.parentId === parentId && !comment.isDeleted ? comment : null;
          } catch {
            return null;
          }
        })
      );

      const validReplies = replies.filter(reply => reply !== null);
      
      // Sort by creation date (oldest first for replies)
      return validReplies.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } catch {
      return [];
    }
  }

  async getCommentCount(ideaId) {
    try {
      const comments = await this.getCommentsForIdea(ideaId);
      return comments.length;
    } catch {
      return 0;
    }
  }
}

module.exports = DocumentStore;
