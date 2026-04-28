#!/usr/bin/env python3
"""
ZixTV File Explorer - Navegue pelos arquivos do projeto e solicite conteúdo específico
"""

import os
import json
from pathlib import Path
from typing import List, Dict, Optional

class ZixTVExplorer:
    def __init__(self, base_path: str = "."):
        self.base_path = Path(base_path)
        self.current_selection = {}
        self.requested_files = []
        
    def list_directory(self, path: str = ".") -> None:
        """Lista o conteúdo de um diretório"""
        full_path = self.base_path / path
        if not full_path.exists():
            print(f"❌ Diretório não encontrado: {path}")
            return
            
        items = []
        for item in sorted(full_path.iterdir()):
            if item.name.startswith('.') and item.name not in ['.env', '.gitignore']:
                continue
            item_type = "📁" if item.is_dir() else "📄"
            items.append(f"{item_type} {item.name}")
            
        print(f"\n📂 Conteúdo de: {path or '/'}")
        print("-" * 60)
        for item in items:
            print(item)
        print("-" * 60)
        print(f"Total: {len(items)} itens\n")
        
    def read_file_content(self, file_path: str) -> Optional[str]:
        """Lê o conteúdo de um arquivo"""
        full_path = self.base_path / file_path
        if not full_path.exists():
            print(f"❌ Arquivo não encontrado: {file_path}")
            return None
            
        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()
            return content
        except Exception as e:
            print(f"❌ Erro ao ler arquivo: {e}")
            return None
            
    def get_tree_structure(self, path: str = ".", max_depth: int = 3, current_depth: int = 0) -> Dict:
        """Obtém estrutura de árvore do projeto"""
        if current_depth >= max_depth:
            return {"type": "max_depth_reached"}
            
        full_path = self.base_path / path
        if not full_path.exists():
            return {}
            
        structure = {"name": path if path != "." else "ZixTV", "type": "dir", "children": []}
        
        try:
            items = sorted(full_path.iterdir())
            for item in items:
                if item.name.startswith('.') and item.name not in ['.env', '.gitignore']:
                    continue
                    
                if item.is_dir():
                    if current_depth < max_depth - 1:
                        structure["children"].append(
                            self.get_tree_structure(str(item.relative_to(self.base_path)), max_depth, current_depth + 1)
                        )
                    else:
                        structure["children"].append({"name": item.name, "type": "dir", "children": []})
                else:
                    structure["children"].append({"name": item.name, "type": "file"})
        except PermissionError:
            pass
            
        return structure
        
    def find_file(self, filename: str) -> List[str]:
        """Encontra arquivos pelo nome"""
        matches = []
        for root, dirs, files in os.walk(self.base_path):
            # Ignorar node_modules, .git, etc
            if 'node_modules' in root or '.git' in root:
                continue
            for file in files:
                if filename.lower() in file.lower():
                    matches.append(os.path.relpath(os.path.join(root, file), self.base_path))
        return matches
        
    def search_content(self, search_term: str, file_pattern: str = ".jsx") -> List[str]:
        """Busca conteúdo em arquivos"""
        matches = []
        for root, dirs, files in os.walk(self.base_path):
            if 'node_modules' in root or '.git' in root:
                continue
            for file in files:
                if file.endswith(file_pattern):
                    file_path = os.path.join(root, file)
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            content = f.read()
                            if search_term.lower() in content.lower():
                                matches.append(os.path.relpath(file_path, self.base_path))
                    except:
                        pass
        return matches
        
    def show_help(self):
        """Mostra ajuda"""
        help_text = """
╔══════════════════════════════════════════════════════════════╗
║                   ZixTV File Explorer                        ║
╚══════════════════════════════════════════════════════════════╝

COMANDOS:
────────────────────────────────────────────────────────────────
  ls [path]              - Lista conteúdo do diretório
  tree [depth]           - Mostra árvore do projeto (depth=2 padrão)
  show <file_path>       - Mostra conteúdo do arquivo
  find <filename>        - Busca arquivo pelo nome
  grep <term> [ext]      - Busca termo em arquivos (ext padrão=.jsx)
  
  request <file_path>    - Solicita arquivo para correção
  show-requests          - Lista arquivos solicitados
  clear-requests         - Limpa lista de solicitações
  
  help                   - Mostra esta ajuda
  exit / quit            - Sai do programa

EXEMPLOS:
────────────────────────────────────────────────────────────────
  ls src/modules/home
  show src/shared/components/MediaCard/MediaCard.jsx
  find MediaCard.jsx
  grep "hover" .css
  request src/shared/hooks/useKeyboardNavigation.js

SOLICITAÇÃO PARA CORREÇÃO:
────────────────────────────────────────────────────────────────
1. Use 'request' para marcar arquivos que precisam ser analisados
2. Use 'show-requests' para ver arquivos solicitados
3. Copie a lista e envie para análise

Arquivos importantes para seu problema:
  • src/shared/components/MediaCard/MediaCard.jsx
  • src/shared/hooks/useKeyboardNavigation.js
  • src/shared/hooks/useFocusable.js
  • src/index.css
  • tailwind.config.js
"""
        print(help_text)
        
    def run(self):
        """Loop principal interativo"""
        print("🚀 Iniciando ZixTV File Explorer...")
        print("Digite 'help' para comandos disponíveis\n")
        
        while True:
            try:
                cmd_input = input("🔍 ZixTV> ").strip()
                if not cmd_input:
                    continue
                    
                parts = cmd_input.split()
                cmd = parts[0].lower()
                
                if cmd in ["exit", "quit", "q"]:
                    print("👋 Saindo...")
                    break
                    
                elif cmd == "help":
                    self.show_help()
                    
                elif cmd == "ls":
                    path = parts[1] if len(parts) > 1 else "."
                    self.list_directory(path)
                    
                elif cmd == "tree":
                    depth = int(parts[1]) if len(parts) > 1 else 2
                    tree = self.get_tree_structure(max_depth=depth)
                    print(json.dumps(tree, indent=2))
                    
                elif cmd == "show":
                    if len(parts) < 2:
                        print("❌ Use: show <caminho/do/arquivo>")
                        continue
                    file_path = " ".join(parts[1:])
                    content = self.read_file_content(file_path)
                    if content:
                        print(f"\n📄 Conteúdo de: {file_path}")
                        print("=" * 80)
                        print(content)
                        print("=" * 80)
                        print(f"Total: {len(content.splitlines())} linhas\n")
                        
                elif cmd == "find":
                    if len(parts) < 2:
                        print("❌ Use: find <nome_do_arquivo>")
                        continue
                    filename = parts[1]
                    matches = self.find_file(filename)
                    if matches:
                        print(f"\n🔍 Encontrados {len(matches)} arquivo(s):")
                        for match in matches:
                            print(f"  📄 {match}")
                        print()
                    else:
                        print(f"❌ Nenhum arquivo encontrado: {filename}\n")
                        
                elif cmd == "grep":
                    if len(parts) < 2:
                        print("❌ Use: grep <termo> [extensao]")
                        continue
                    term = parts[1]
                    ext = parts[2] if len(parts) > 2 else ".jsx"
                    matches = self.search_content(term, ext)
                    if matches:
                        print(f"\n🔍 Encontrados {len(matches)} arquivo(s) com '{term}':")
                        for match in matches:
                            print(f"  📄 {match}")
                        print()
                    else:
                        print(f"❌ Nenhum arquivo encontrado com '{term}' em *{ext}\n")
                        
                elif cmd == "request":
                    if len(parts) < 2:
                        print("❌ Use: request <caminho/do/arquivo>")
                        continue
                    file_path = " ".join(parts[1:])
                    if file_path not in self.requested_files:
                        self.requested_files.append(file_path)
                        print(f"✅ Arquivo adicionado à solicitação: {file_path}")
                    else:
                        print(f"⚠️ Arquivo já está na lista: {file_path}")
                    print(f"📋 Total na lista: {len(self.requested_files)} arquivo(s)\n")
                    
                elif cmd == "show-requests":
                    if self.requested_files:
                        print("\n📋 ARQUIVOS SOLICITADOS PARA CORREÇÃO:")
                        print("-" * 60)
                        for i, file_path in enumerate(self.requested_files, 1):
                            print(f"{i}. {file_path}")
                        print("-" * 60)
                        print("\n💡 Copie esta lista e peça para analisar estes arquivos\n")
                    else:
                        print("📭 Nenhum arquivo solicitado ainda. Use 'request' para adicionar.\n")
                        
                elif cmd == "clear-requests":
                    self.requested_files.clear()
                    print("🗑️ Lista de solicitações limpa!\n")
                    
                else:
                    print(f"❌ Comando desconhecido: {cmd}")
                    print("Digite 'help' para comandos disponíveis\n")
                    
            except KeyboardInterrupt:
                print("\n👋 Saindo...")
                break
            except Exception as e:
                print(f"❌ Erro: {e}\n")

def main():
    explorer = ZixTVExplorer()
    explorer.run()

if __name__ == "__main__":
    main()