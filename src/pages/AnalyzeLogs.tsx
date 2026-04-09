import { Layout } from "@/components/Layout";
import { useState, useCallback } from "react";
import { Upload, FileText, Plug, Play } from "lucide-react";

const AnalyzeLogs = () => {
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState<string[]>([]);
  const [endpoint, setEndpoint] = useState("");

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files).map((f) => f.name);
    setFiles((prev) => [...prev, ...dropped]);
  }, []);

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
          className={`glass-panel rounded-xl p-10 text-center transition-all duration-300 cursor-pointer ${
            dragOver ? "border-primary/60 glow-primary" : "border-border"
          }`}
        >
          <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-medium">Drag & drop log files here</p>
          <p className="text-xs text-muted-foreground mt-1">Supports .txt, .log, .csv files</p>
          <button
            onClick={() => setFiles((p) => [...p, `sample-log-${p.length + 1}.log`])}
            className="cyber-btn-outline text-xs mt-4 !py-1.5"
          >
            Browse Files
          </button>
        </div>

        {files.length > 0 && (
          <div className="glass-panel rounded-xl p-4 space-y-2">
            <p className="text-sm font-medium text-foreground">Selected Files</p>
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="w-4 h-4" />
                {f}
              </div>
            ))}
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
