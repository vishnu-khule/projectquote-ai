import { Injectable } from "@nestjs/common";
import { EventEmitter } from "node:events";

export type DocumentJobEvent = {
  type: "document.job";
  projectId: string;
  documentId: string;
  jobId: string;
  status: string;
  extraction?: unknown;
  error?: string;
};

@Injectable()
export class DocumentEventsService {
  private readonly emitter = new EventEmitter();
  private readonly projectStreams = new Map<string, Set<(e: DocumentJobEvent) => void>>();

  emit(event: DocumentJobEvent) {
    const listeners = this.projectStreams.get(event.projectId);
    if (listeners) {
      for (const listener of listeners) {
        listener(event);
      }
    }
    this.emitter.emit(event.projectId, event);
  }

  subscribe(
    projectId: string,
    listener: (event: DocumentJobEvent) => void,
  ): () => void {
    const set = this.projectStreams.get(projectId) ?? new Set();
    set.add(listener);
    this.projectStreams.set(projectId, set);
    return () => {
      set.delete(listener);
      if (set.size === 0) {
        this.projectStreams.delete(projectId);
      }
    };
  }
}
