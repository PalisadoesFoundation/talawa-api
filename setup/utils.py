from rich.markdown import Markdown
from rich.console import Console
console = Console()

def display_markdown(text,color = 'yellow'):
    markdown = Markdown(text,style=color)
    console.print(markdown)
    
def display_success(text,color = 'yellow'):
    console.print(text,style=color)

def exit_process(reason=""):
    console.print("ERROR:Exiting current process :cross_mark:",style="red")
    console.print("REASON:",reason,style="yellow")
    exit()