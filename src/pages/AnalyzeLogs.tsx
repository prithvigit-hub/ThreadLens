import { Layout } from "@/components/Layout";
import { useState, useCallback, useRef } from "react";
import { Upload, FileText, Plug, Play, CheckCircle, AlertCircle, Loader2, X } from "lucide-react";
import { api } from "@/lib/api";

interface UploadResult {
  success: boolean;
  logs_parsed: number;
  threats_detected: number;
  session_id: string;
}

const AnalyzeLogs = () => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [endpoint, setEndpoint] = useState("");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = (newFiles: File[]) => {
    const valid = newFiles.filter((f) => /\.(txt|log|csv)$/i.test(f.name));
    if (valid.length < newFiles.length) setError("Only .txt, .log, .csv files are supported");
    else setError(null);
    setSelectedFiles((prev) => [...prev, ...valid]);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(Array.from(e.dataTransfer.files));
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files));
  };

  const removeFile = (i: number) =>
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== i));

  const handleUpload = async () => {
    if (!selectedFiles.length) return;
    setUploading(true);
    setResult(null);
    setError(null);
    try {
      const res = await api.uploadLogs(selectedFiles[0]);
      setResult(res);
      setSelectedFiles([]);
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
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
          onClick={() => fileInputRef.current?.click()}
          className={`glass-panel rounded-xl p-10 text-center transition-all duration-300 cursor-pointer ${
            dragOver ? "border-primary/60 glow-primary" : "border-border"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.log,.csv"
            multiple
            className="hidden"
            onChange={handleFileInput}
          />
          <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-medium">Drag & drop log files here</p>
          <p className="text-xs text-muted-foreground mt-1">Supports .txt, .log, .csv files</p>
          <button className="cyber-btn-outline text-xs mt-4 !py-1.5">Browse Files</button>
        </div>

        {error && (
          <div className="glass-panel rounded-xl p-4 flex items-center gap-3 border-destructive/30">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {result && (
          <div className="glass-panel rounded-xl p-4 flex items-start gap-3 border-safe/30">
            <CheckCircle className="w-5 h-5 text-safe shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Upload Successful</p>
              <p className="text-xs text-muted-foreground mt-1">
                {result.logs_parsed.toLocaleString()} logs parsed · {result.threats_detected} threats detected
              </p>
            </div>
          </div>
        )}

        {selectedFiles.length > 0 && (
          <div className="glass-panel rounded-xl p-4 space-y-2">
            <p className="text-sm font-medium text-foreground">Selected Files</p>
            {selectedFiles.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="w-4 h-4 shrink-0" />
                <span className="flex-1 truncate">{f.name}</span>
                <span className="text-xs">({(f.size / 1024).toFixed(1)} KB)</span>
                <button onClick={() => removeFile(i)} className="hover:text-destructive transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="cyber-btn flex items-center gap-2 text-sm mt-2 w-full justify-center"
            >
              {uploading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Uploading & Analyzing...</>
              ) : (
                <><Upload className="w-4 h-4" /> Upload & Analyze</>
              )}
            </button>
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
          />
          <button className="cyber-btn flex items-center gap-2 text-sm">
            <Play className="w-4 h-4" />
            Start Monitoring
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default AnalyzeLogs;
