import { Layout } from "@/components/Layout";
import { useState, useCallback, useRef, useEffect } from "react";
import { Upload, FileText, Plug, Play, CheckCircle, AlertCircle, Loader2, X, HardDrive } from "lucide-react";

interface UploadResult {
  success: boolean;
  logs_parsed: number;
  threats_detected: number;
  session_id: string;
  file_size_mb: number;
  truncated: boolean;
}

interface JobStatus {
  status: "processing" | "done" | "failed";
  filename?: string;
  logs_stored?: number;
  logs_parsed?: number;
  threats_detected?: number;
  session_id?: string;
  file_size_mb?: number;
  truncated?: boolean;
  error?: string;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

const MAX_SIZE = 10 * 1024 * 1024 * 1024; // 10 GB

const AnalyzeLogs = () => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [endpoint, setEndpoint] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingJobId, setProcessingJobId] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<JobStatus | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll job status while processing
  useEffect(() => {
    if (!processingJobId) return;

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/upload/status/${processingJobId}`);
        if (!res.ok) return;
        const job: JobStatus = await res.json();
        setProcessingStatus(job);

        if (job.status === "done") {
          clearInterval(pollRef.current!);
          setProcessingJobId(null);
          setUploading(false);
          setUploadProgress(0);
          setResult({
            success: true,
            logs_parsed: job.logs_parsed ?? 0,
            threats_detected: job.threats_detected ?? 0,
            session_id: job.session_id ?? "",
            file_size_mb: job.file_size_mb ?? 0,
            truncated: job.truncated ?? false,
          });
          setSelectedFiles([]);
        } else if (job.status === "failed") {
          clearInterval(pollRef.current!);
          setProcessingJobId(null);
          setUploading(false);
          setUploadProgress(0);
          setError(job.error || "Processing failed. Please try again.");
        }
      } catch {
        // network blip — keep polling
      }
    }, 2000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [processingJobId]);

  const addFiles = (newFiles: File[]) => {
    setError(null);
    const oversized = newFiles.filter((f) => f.size > MAX_SIZE);
    if (oversized.length) {
      setError("File too large. Maximum supported size is 10 GB.");
      return;
    }
    const valid = newFiles.filter((f) => /\.(txt|log|csv)$/i.test(f.name));
    if (valid.length < newFiles.length) {
      setError("Only .txt, .log, .csv files are supported");
    }
    setSelectedFiles((prev) => [...prev, ...valid]);
    setResult(null);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(Array.from(e.dataTransfer.files));
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files));
  };

  const removeFile = (i: number) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== i));
    setResult(null);
    setError(null);
  };

  const cancelUpload = () => {
    xhrRef.current?.abort();
    if (pollRef.current) clearInterval(pollRef.current);
    setProcessingJobId(null);
    setProcessingStatus(null);
    setUploading(false);
    setUploadProgress(0);
  };

  const handleUpload = () => {
    if (!selectedFiles.length) return;
    const file = selectedFiles[0];
    setUploading(true);
    setResult(null);
    setError(null);
    setUploadProgress(0);
    setProcessingStatus(null);

    const form = new FormData();
    form.append("file", file);

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        setUploadProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.job_id) {
            setProcessingJobId(data.job_id);
            setProcessingStatus({ status: "processing", logs_stored: 0 });
          }
        } catch {
          setUploading(false);
          setError("Unexpected response from server");
        }
      } else {
        setUploading(false);
        try {
          const err = JSON.parse(xhr.responseText);
          setError(err.detail || `Upload failed (HTTP ${xhr.status})`);
        } catch {
          setError(`Upload failed (HTTP ${xhr.status})`);
        }
      }
    };

    xhr.onerror = () => {
      setUploading(false);
      setError("Network error during upload. Please try again.");
    };

    xhr.onabort = () => {
      setUploading(false);
      setUploadProgress(0);
      setError("Upload cancelled.");
    };

    xhr.open("POST", "/api/upload");
    xhr.send(form);
  };

  const isProcessing = uploading || !!processingJobId;
  const phase = processingJobId
    ? "processing"
    : uploadProgress < 100
    ? "uploading"
    : "queuing";

  return (
    <Layout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div>
          <h2 className="text-xl font-bold text-foreground">Analyze Logs</h2>
          <p className="text-sm text-muted-foreground mt-1">Upload log files or connect a source for analysis</p>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          className={`glass-panel rounded-xl p-10 text-center transition-all duration-300 cursor-pointer ${
            dragOver ? "border-primary/60 glow-primary" : "border-border"
          } ${isProcessing ? "cursor-not-allowed opacity-60" : ""}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.log,.csv"
            multiple
            className="hidden"
            onChange={handleFileInput}
          />
          <HardDrive className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-medium">Drag & drop log files here</p>
          <p className="text-xs text-muted-foreground mt-1">
            Supports .txt, .log, .csv files up to <span className="text-primary font-semibold">10 GB</span> · up to 10 million log entries
          </p>
          <button className="cyber-btn-outline text-xs mt-4 !py-1.5" disabled={isProcessing}>Browse Files</button>
        </div>

        {error && (
          <div className="glass-panel rounded-xl p-4 flex items-center gap-3 border-destructive/30">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {result && (
          <div className="glass-panel rounded-xl p-4 space-y-2 border-safe/30">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-safe shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Upload Successful</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {result.logs_parsed.toLocaleString()} logs parsed · {result.threats_detected} threats detected · {result.file_size_mb} MB processed
                </p>
                {result.truncated && (
                  <p className="text-xs text-yellow-500 mt-1">
                    File was very large — first 10,000,000 log entries were stored.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {selectedFiles.length > 0 && (
          <div className="glass-panel rounded-xl p-4 space-y-3">
            <p className="text-sm font-medium text-foreground">Selected Files</p>
            {selectedFiles.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="w-4 h-4 shrink-0" />
                <span className="flex-1 truncate">{f.name}</span>
                <span className="text-xs shrink-0">{formatBytes(f.size)}</span>
                {!isProcessing && (
                  <button onClick={() => removeFile(i)} className="hover:text-destructive transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}

            {isProcessing && (
              <div className="space-y-2">
                {/* Upload progress bar */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {phase === "uploading"
                      ? "Uploading file..."
                      : phase === "queuing"
                      ? "Sending to server..."
                      : "Processing logs..."}
                  </span>
                  {phase === "uploading" && (
                    <span className="font-medium text-primary">{uploadProgress}%</span>
                  )}
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      phase === "processing"
                        ? "bg-primary animate-pulse w-full"
                        : "bg-primary"
                    }`}
                    style={phase !== "processing" ? { width: `${uploadProgress}%` } : undefined}
                  />
                </div>
                {phase === "processing" && processingStatus && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                    <span>
                      Parsing and storing logs in database
                      {(processingStatus.logs_stored ?? 0) > 0
                        ? ` — ${(processingStatus.logs_stored ?? 0).toLocaleString()} entries stored so far...`
                        : "..."}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              {!isProcessing ? (
                <button
                  onClick={handleUpload}
                  data-testid="button-upload-analyze"
                  className="cyber-btn flex items-center gap-2 text-sm flex-1 justify-center"
                >
                  <Upload className="w-4 h-4" />
                  Upload & Analyze
                </button>
              ) : (
                <button
                  onClick={cancelUpload}
                  data-testid="button-cancel-upload"
                  className="cyber-btn-outline flex items-center gap-2 text-sm flex-1 justify-center text-destructive border-destructive/40"
                >
                  <X className="w-4 h-4" />
                  Cancel Upload
                </button>
              )}
            </div>
          </div>
        )}

        <div className="glass-panel rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Plug className="w-4 h-4 text-primary" />
            <p className="text-sm font-medium text-foreground">Connect Source</p>
          </div>
          <input
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            placeholder="Enter API endpoint or file path..."
            className="cyber-input w-full text-sm"
            data-testid="input-endpoint"
          />
          <button className="cyber-btn flex items-center gap-2 text-sm" data-testid="button-start-monitoring">
            <Play className="w-4 h-4" />
            Start Monitoring
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default AnalyzeLogs;
