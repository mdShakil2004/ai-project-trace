import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileCode2, FolderGit2, Search, Settings, Sparkles } from "lucide-react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { api } from "@/services/api";

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const navigate = useNavigate();
  const { data: investigations = [] } = useQuery({ queryKey: ["investigations"], queryFn: api.listInvestigations, staleTime: 30_000, enabled: open });
  const { data: repositories = [] } = useQuery({ queryKey: ["repositories"], queryFn: api.listRepositories, staleTime: 30_000, enabled: open });
  useEffect(() => { const handler=(e:KeyboardEvent)=>{if(e.key.toLowerCase()==="k"&&(e.metaKey||e.ctrlKey)){e.preventDefault();onOpenChange(!open);}}; window.addEventListener("keydown",handler); return()=>window.removeEventListener("keydown",handler); },[open,onOpenChange]);
  const go=(to:string)=>{onOpenChange(false);void navigate({to});};
  return <CommandDialog open={open} onOpenChange={onOpenChange} title="Search Trace" description="Search pull requests, investigations, repositories and files"><CommandInput placeholder="Search investigations, repositories, files…"/><CommandList><CommandEmpty>No matches in this workspace.</CommandEmpty><CommandGroup heading="Actions"><CommandItem onSelect={()=>go("/analyze")}><Sparkles/>Analyze a pull request</CommandItem></CommandGroup><CommandSeparator/><CommandGroup heading="Investigations">{investigations.map(inv=><CommandItem key={inv.id} value={`${inv.repository} ${inv.pullRequest.number} ${inv.pullRequest.title}`} onSelect={()=>go(`/investigation/${inv.id}`)}><FileCode2/><span className="mono">#{inv.pullRequest.number}</span><span>{inv.pullRequest.title}</span><span className="mono ml-auto text-[11px] text-muted-foreground">{inv.repository}</span></CommandItem>)}</CommandGroup><CommandGroup heading="Repositories">{repositories.map(repo=><CommandItem key={repo.id} value={repo.fullName} onSelect={()=>go(`/repositories/${repo.id}`)}><FolderGit2/><span className="mono">{repo.fullName}</span></CommandItem>)}</CommandGroup><CommandGroup heading="Navigate"><CommandItem onSelect={()=>go("/investigations")}><Search/>All investigations</CommandItem><CommandItem onSelect={()=>go("/settings")}><Settings/>Settings</CommandItem></CommandGroup></CommandList></CommandDialog>;
}
