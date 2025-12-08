import { Info } from "lucide-react";

export function FormattingHelp() {
    return (
        <div className="relative group inline-block ml-2">
            <div className="cursor-help text-slate-400 hover:text-teal-600 transition-colors">
                <Info className="h-4 w-4" />
            </div>

            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 p-4 bg-slate-900 text-slate-50 text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none group-hover:pointer-events-auto">
                <h4 className="font-semibold mb-2 text-teal-400 text-sm">Formatting Guide</h4>

                <div className="space-y-3">
                    <div>
                        <span className="font-bold text-white block mb-0.5">Bold & Italic</span>
                        <code className="bg-slate-800 px-1 rounded">**bold**</code> or <code className="bg-slate-800 px-1 rounded">*italic*</code>
                    </div>

                    <div>
                        <span className="font-bold text-white block mb-0.5">Blue Highlight Box</span>
                        <code className="bg-slate-800 px-1 rounded">&gt; Your text here</code>
                    </div>

                    <div>
                        <span className="font-bold text-white block mb-0.5">Color Text</span>
                        <div className="bg-slate-800 p-1.5 rounded overflow-x-auto whitespace-pre">
                            &lt;span style="color: red"&gt;text&lt;/span&gt;
                        </div>
                        <div className="text-slate-400 mt-0.5 text-[10px]">
                            Colors: red, blue, green, #hex
                        </div>
                    </div>

                    <div>
                        <span className="font-bold text-white block mb-0.5">Lists</span>
                        <code className="bg-slate-800 px-1 rounded">- Bullet item</code>
                    </div>

                    <div>
                        <span className="font-bold text-white block mb-0.5">Links & Images</span>
                        <div className="flex flex-col gap-1">
                            <code className="bg-slate-800 px-1 rounded">[Link Text](url)</code>
                            <code className="bg-slate-800 px-1 rounded">![Image Alt](url)</code>
                        </div>
                    </div>
                </div>

                {/* Arrow */}
                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-900"></div>
            </div>
        </div>
    );
}
