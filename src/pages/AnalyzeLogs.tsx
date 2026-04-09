import { Layout } from "@/components/Layout";
import { useState, useCallback, useRef } from "react";
import { Upload, FileText, Plug, Play, CheckCircle, AlertCircle, Loader2, X, HardDrive } from "lucide-react";

interface UploadResult {
  success: boolean;
  logs_parsed: number;
  threats_detected: number;
  session_id: string;
  file_size_mb: number;
  truncated: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

const MAX_SIZE = 1 * 1024 * 1024 * 1024; // 1 GB

const AnalyzeLogs = () => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [endpoint, setEndpoint] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const addFiles = (newFiles: File[]) => {
    setError(null);
    const oversized = newFiles.filter((f) => f.size > MAX_SIZE);
    if (oversized.length) {
      setError(`File too large. Maximum supported size is 1 GB.`);
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
    setUploading(false);
    setProgress(0);
  };

  const handleUpload = () => {
    if (!selectedFiles.length) return;
    const file = selectedFiles[0];
    setUploading(true);
    setResult(null);
    setError(null);
    setProgress(0);

    const form = new FormData();
    form.append("file", file);

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        setProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      setUploading(false);
      if (xhr.status === 200) {
        try {
          const data: UploadResult = JSON.parse(xhr.responseText);
          setResult(data);
          setSelectedFiles([]);
          setProgress(0);
        } catch {
          setError("Unexpected response from server");
        }
      } else {
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
      setProgress(0);
      setError("Upload cancelled.");
    };

    xhr.open("POST", "/api/upload");
    xhr.timeout = 30 * 60 * 1000; // 30 minute timeout for large files
    xhr.send(form);
  };

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
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`glass-panel rounded-xl p-10 text-center transition-all duration-300 cursor-pointer ${
            dragOver ? "border-primary/60 glow-primary" : "border-border"
          } ${uploading ? "cursor-not-allowed opacity-60" : ""}`}
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
          <p className="text-xs text-muted-foreground mt-1">Supports .txt, .log, .csv files up to <span className="text-primary font-semibold">1 GB</span></p>
          <button className="cyber-btn-outline text-xs mt-4 !py-1.5" disabled={uploading}>Browse Files</button>
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
                    File was very large — first 1,000,000 log entries were stored.
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
                {!uploading && (
                  <button onClick={() => removeFile(i)} className="hover:text-destructive transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}

            {uploading && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Uploading & processing...</span>
                  <span className="font-medium text-primary">{progress}%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {progress === 100 && (
                  <p className="text-xs text-muted-foreground">Parsing and storing logs in database...</p>
                )}
              </div>
            )}

            <div className="flex gap-2">
              {!uploading ? (
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
