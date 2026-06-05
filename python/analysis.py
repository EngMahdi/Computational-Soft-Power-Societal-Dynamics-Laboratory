"""
Computational Soft Power & Societal Dynamics Laboratory
Python Analysis Toolkit
"""

import json
import pandas as pd
import numpy as np
from typing import Dict, List, Any
import matplotlib.pyplot as plt
import seaborn as sns

class SimulationAnalyzer:
    def __init__(self, export_json: str):
        """تحليل بيانات المحاكاة المُصدَّرة"""
        self.data = json.loads(export_json)
        self.metrics_history = []
        
    def load_metrics_csv(self, csv_path: str):
        """تحميل سجل المقاييس من ملف CSV"""
        self.metrics_df = pd.read_csv(csv_path)
        return self.metrics_df
    
    def calculate_polarization_trend(self) -> List[float]:
        """حساب اتجاه الاستقطاب عبر الوقت"""
        if not hasattr(self, 'metrics_df'):
            return []
        return self.metrics_df['polarization'].tolist()
    
    def analyze_belief_clusters(self) -> Dict[str, Any]:
        """تحليل تجمعات المعتقدات"""
        agents = self.data.get('agents', [])
        
        clustering_info = {
            'total_agents': len(agents),
            'avg_beliefs_per_agent': np.mean([len(a.get('beliefs', {})) for a in agents]),
            'belief_variance': np.std([len(a.get('beliefs', {})) for a in agents]),
        }
        
        return clustering_info
    
    def plot_polarization_over_time(self, save_path: str = None):
        """رسم بياني لتطور الاستقطاب"""
        if not hasattr(self, 'metrics_df'):
            return
        
        plt.figure(figsize=(12, 6))
        plt.plot(self.metrics_df['tick'], self.metrics_df['polarization'], 
                 label='Polarization Index', linewidth=2)
        plt.xlabel('Tick')
        plt.ylabel('Polarization Index')
        plt.title('Social Polarization Over Time')
        plt.legend()
        plt.grid(True, alpha=0.3)
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
        
        plt.show()
    
    def plot_all_metrics(self, save_path: str = None):
        """رسم جميع المقاييس الرئيسية"""
        if not hasattr(self, 'metrics_df'):
            return
        
        fig, axes = plt.subplots(2, 3, figsize=(16, 10))
        
        metrics_to_plot = [
            ('polarization', 'Polarization Index'),
            ('cohesion', 'Cohesion Score'),
            ('echo_density', 'Echo Density'),
            ('belief_adoption', 'Belief Adoption'),
            ('identity_fragmentation', 'Identity Fragmentation'),
        ]
        
        for idx, (col, title) in enumerate(metrics_to_plot):
            ax = axes[idx // 3, idx % 3]
            if col in self.metrics_df.columns:
                ax.plot(self.metrics_df['tick'], self.metrics_df[col], linewidth=2)
                ax.set_title(title)
                ax.set_xlabel('Tick')
                ax.set_ylabel('Value')
                ax.grid(True, alpha=0.3)
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
        
        plt.show()
    
    def correlation_analysis(self) -> pd.DataFrame:
        """حساب الارتباطات بين المقاييس"""
        if not hasattr(self, 'metrics_df'):
            return pd.DataFrame()
        
        numeric_cols = self.metrics_df.select_dtypes(include=[np.number]).columns
        return self.metrics_df[numeric_cols].corr()
    
    def get_summary_statistics(self) -> Dict[str, Any]:
        """إحصائيات ملخصة للمحاكاة"""
        if not hasattr(self, 'metrics_df'):
            return {}
        
        return {
            'max_polarization': self.metrics_df['polarization'].max(),
            'min_polarization': self.metrics_df['polarization'].min(),
            'avg_polarization': self.metrics_df['polarization'].mean(),
            'final_polarization': self.metrics_df['polarization'].iloc[-1],
            'max_echo_density': self.metrics_df['echo_density'].max(),
            'avg_echo_density': self.metrics_df['echo_density'].mean(),
            'total_ticks': len(self.metrics_df),
        }


def validate_experiment_reproducibility(export1: str, export2: str, tolerance: float = 0.01) -> bool:
    """التحقق من إعادة إنتاجية التجربة"""
    data1 = json.loads(export1)
    data2 = json.loads(export2)
    
    metrics1 = data1.get('metrics', {})
    metrics2 = data2.get('metrics', {})
    
    for key in metrics1:
        if key in metrics2:
            if abs(metrics1[key] - metrics2[key]) > tolerance:
                return False
    
    return True


if __name__ == "__main__":
    print("Soft Power Lab - Python Analysis Toolkit loaded")
