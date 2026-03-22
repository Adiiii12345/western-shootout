import sys
import os
import json
import io
import zstandard as zstd
from pathlib import Path

import customtkinter as ctk
import polars as pl
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import numpy as np

current_dir = Path(__file__).resolve().parent
math_sdk_root = current_dir.parent
if str(math_sdk_root) not in sys.path:
    sys.path.insert(0, str(math_sdk_root))

ctk.set_appearance_mode("Dark")
ctk.set_default_color_theme("blue")

class WesternExplorer(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("Western Shootout - RGS Math Explorer v2.1")
        self.geometry("1300x900")

        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(0, weight=1)

        self.sidebar = ctk.CTkFrame(self, width=220, corner_radius=0)
        self.sidebar.grid(row=0, column=0, sticky="nsew", padx=10, pady=10)
        
        self.logo_label = ctk.CTkLabel(self.sidebar, text="MATH STATS", font=ctk.CTkFont(size=22, weight="bold"))
        self.logo_label.pack(pady=20)

        self.mode_var = ctk.StringVar(value="base")
        for mode in ["base", "armor", "magnet", "extreme"]:
            rb = ctk.CTkRadioButton(self.sidebar, text=mode.capitalize(), variable=self.mode_var, value=mode)
            rb.pack(pady=10, padx=20, anchor="w")

        self.load_btn = ctk.CTkButton(self.sidebar, text="KÖNYV ELEMZÉSE", font=ctk.CTkFont(weight="bold"), 
                                      fg_color="#2ecc71", hover_color="#27ae60", command=self.load_and_analyze)
        self.load_btn.pack(pady=30, padx=20)

        self.v_label = ctk.CTkLabel(self.sidebar, text="STEP VERIFIER (Last Win / Debug):", font=ctk.CTkFont(size=11, weight="bold"))
        self.v_label.pack(pady=(10, 0), padx=20, anchor="w")
        
        self.step_box = ctk.CTkTextbox(self.sidebar, width=200, height=300, font=ctk.CTkFont(size=10), fg_color="#1e1e1e")
        self.step_box.pack(pady=10, padx=10)

        self.info_lbl = ctk.CTkLabel(self.sidebar, text="Engine: Polars + Zstd\nTarget RTP: 96.00%", font=ctk.CTkFont(size=10), text_color="gray")
        self.info_lbl.pack(side="bottom", pady=10)

        self.main_frame = ctk.CTkFrame(self)
        self.main_frame.grid(row=0, column=1, sticky="nsew", padx=10, pady=10)
        self.main_frame.grid_columnconfigure((0, 1, 2, 3), weight=1)

        self.stats_labels = {}
        metrics = ["RTP", "Hit Rate", "Volatility", "Zero Rate", "Max Win", "Mean", "Outcomes"]
        for i, metric in enumerate(metrics):
            frame = ctk.CTkFrame(self.main_frame, corner_radius=10)
            frame.grid(row=i // 4, column=i % 4, padx=10, pady=10, sticky="nsew")
            
            lbl_title = ctk.CTkLabel(frame, text=metric.upper(), font=ctk.CTkFont(size=11, weight="bold"), text_color="#3498db")
            lbl_title.pack(pady=(10, 0))
            
            lbl_val = ctk.CTkLabel(frame, text="-", font=ctk.CTkFont(size=22, weight="bold"))
            lbl_val.pack(pady=(0, 10))
            self.stats_labels[metric] = lbl_val

        self.chart_frame = ctk.CTkFrame(self.main_frame, fg_color="transparent")
        self.chart_frame.grid(row=2, column=0, columnspan=4, padx=10, pady=10, sticky="nsew")
        self.main_frame.grid_rowconfigure(2, weight=1)

    def load_and_analyze(self):
        self.step_box.delete("1.0", "end")
        mode = self.mode_var.get()
        
        file_path = math_sdk_root / "games" / "western_shootout_95" / "library" / "publish_files" / f"books_{mode}.jsonl.zst"

        if not file_path.exists():
            self.step_box.insert("1.0", f"Hiba: Fájl nem található\n{file_path}")
            return

        with open(file_path, 'rb') as f:
            dctx = zstd.ZstdDecompressor()
            with dctx.stream_reader(f) as reader:
                raw_data = reader.read()
                df = pl.read_ndjson(io.BytesIO(raw_data))

        if "events" not in df.columns:
            self.step_box.insert("1.0", f"Hiba: Az 'events' oszlop nem található a fájlban.\nElérhető oszlopok: {df.columns}")
            return

        events_df = df.explode("events").unnest("events")
        
        win_data = events_df.filter(pl.col("finalMultiplier").is_not_null())
        
        if "finalMultiplier" in win_data.columns:
            multipliers = win_data["finalMultiplier"].drop_nulls().to_numpy()
        else:
            multipliers = np.array([])
            
        samples = len(multipliers)
        
        if samples == 0:
            types_found = events_df["type"].unique().to_list() if "type" in events_df.columns else "Nincs type oszlop"
            self.step_box.insert("1.0", f"Hiba: Nulla érvényes esemény.\nTalált típusok:\n{types_found}\n\nOszlopok:\n{events_df.columns}")
            return
        
        rtp = np.mean(multipliers) * 100
        hit_rate = (np.count_nonzero(multipliers > 0.1) / samples) * 100
        volatility = np.std(multipliers)
        zero_rate = (np.sum(multipliers == 0) / samples) * 100
        max_win = np.max(multipliers)
        mean_mult = np.mean(multipliers)

        # 96.0% RTP cél, ±0.5% tűréshatár a zöld színezéshez
        self.stats_labels["RTP"].configure(text=f"{rtp:.2f}%", text_color="#2ecc71" if 95.5 <= rtp <= 96.5 else "#e74c3c")
        self.stats_labels["Hit Rate"].configure(text=f"{hit_rate:.2f}%")
        self.stats_labels["Volatility"].configure(text=f"{volatility:.2f}")
        self.stats_labels["Zero Rate"].configure(text=f"{zero_rate:.2f}%")
        self.stats_labels["Max Win"].configure(text=f"{max_win:.2f}x")
        self.stats_labels["Mean"].configure(text=f"{mean_mult:.4f}")
        self.stats_labels["Outcomes"].configure(text=f"{samples:,}")

        winning_rounds = win_data.filter(pl.col("finalMultiplier") > 0).tail(1)
        
        if not winning_rounds.is_empty():
            try:
                round_info = winning_rounds["round_data"][0]
                if isinstance(round_info, str):
                    round_info = json.loads(round_info)
                
                steps = round_info.get("steps", [])
                formatted_steps = json.dumps(steps, indent=2)
                self.step_box.insert("1.0", f"MODE: {mode}\nWIN: {winning_rounds['finalMultiplier'][0]}x\n\nSTEPS:\n{formatted_steps}")
            except Exception as e:
                self.step_box.insert("1.0", f"Hiba a Step parszeolásakor:\n{e}")
        
        self.update_charts(multipliers)

    def update_charts(self, multipliers):
        for widget in self.chart_frame.winfo_children():
            widget.destroy()

        plt.rcParams.update({'text.color': "white", 'axes.labelcolor': "white", 'xtick.color': "white", 'ytick.color': "white"})
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(11, 5), facecolor='#2b2b2b')
        fig.subplots_adjust(bottom=0.15, wspace=0.3)

        wins_only = multipliers[multipliers > 0]
        if len(wins_only) > 0:
            ax1.hist(wins_only, bins=50, color='#3498db', alpha=0.8, log=True)
            ax1.set_title("Win Distribution (Log Scale)", pad=15)
            ax1.set_xlabel("Multiplier (x)")
        ax1.set_facecolor('#1e1e1e')
        ax1.grid(True, alpha=0.1)

        cum_rtp = np.cumsum(multipliers) / (np.arange(len(multipliers)) + 1) * 100
        ax2.plot(cum_rtp, color='#2ecc71', linewidth=1.5)
        ax2.axhline(y=96.0, color='#e67e22', linestyle='--', alpha=0.5, label="Target 96%")
        ax2.set_title("RTP Convergence (Stability)", pad=15)
        ax2.set_xlabel("Iterations")
        ax2.set_ylabel("Cumulative RTP %")
        ax2.set_facecolor('#1e1e1e')
        ax2.grid(True, alpha=0.1)

        canvas = FigureCanvasTkAgg(fig, master=self.chart_frame)
        canvas.draw()
        canvas.get_tk_widget().pack(fill="both", expand=True)

if __name__ == "__main__":
    app = WesternExplorer()
    app.mainloop()