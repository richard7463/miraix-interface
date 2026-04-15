import "server-only";

import { spawn } from "child_process";
import path from "path";
import { PermitCheckoutRun, findPermitStrategy } from "@/lib/permitCheckoutDemo";
import { PermitCheckoutLiveExecutionResult } from "@/lib/permitCheckoutDemoStore";

const REPO_ROOT = process.cwd();
const SKILL_ROOT = path.join(
  REPO_ROOT,
  "projects/xlayer-execution-guard/skills/xlayer-execution-guard",
);
const RUNNER = path.join(SKILL_ROOT, "scripts/run_execution_guard.py");
const RUNTIME = path.join(SKILL_ROOT, "runtime");
const XLAYER_EXPLORER_TX = "https://www.oklink.com/xlayer/tx";

function parseAmountLabel(value: string) {
  const match = value.match(/([0-9]+(?:\.[0-9]+)?)/);
  return match ? match[1] : "10";
}

function extractJsonFromText(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch {
    const objectStart = trimmed.indexOf("{");
    const arrayStart = trimmed.indexOf("[");
    const starts = [objectStart, arrayStart].filter((index) => index >= 0);

    if (!starts.length) return null;

    try {
      return JSON.parse(trimmed.slice(Math.min(...starts)));
    } catch {
      return null;
    }
  }
}

function findTxHash(value: unknown): string | null {
  if (typeof value === "string") {
    const match = value.match(/0x[a-fA-F0-9]{64}/);
    return match?.[0] ?? null;
  }

  if (!value || typeof value !== "object") return null;

  const queue: unknown[] = [value];
  const visited = new Set<unknown>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== "object" || visited.has(current)) continue;

    visited.add(current);
    const record = current as Record<string, unknown>;

    for (const key of ["tx_hash", "txHash", "transactionHash", "swapTxHash", "hash"]) {
      const field = record[key];
      if (typeof field === "string" && /^0x[a-fA-F0-9]{64}$/.test(field)) {
        return field;
      }
    }

    Object.values(record).forEach((field) => {
      if (field && typeof field === "object") {
        queue.push(field);
      }
    });
  }

  return null;
}

function runCommand(command: string, args: string[]) {
  return new Promise<{ code: number | null; stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: REPO_ROOT,
      env: {
        ...process.env,
        PATH: `${process.env.HOME}/.local/bin:/usr/local/bin:/opt/homebrew/bin:${process.env.PATH || ""}`,
        PYTHONPATH: RUNTIME,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error("Agentic Wallet execution timed out after 75s."));
    }, 75_000);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timeout);
      resolve({ code, stdout, stderr });
    });
  });
}

export async function executePermitWithAgenticWallet(
  run: PermitCheckoutRun,
): Promise<PermitCheckoutLiveExecutionResult> {
  const strategy = findPermitStrategy(run.strategyId);
  if (!strategy) {
    throw new Error("Unknown strategy.");
  }

  if (strategy.id !== "stable-swap") {
    throw new Error("Live Agentic Wallet execution is wired for the stable-swap success path only.");
  }

  if (run.guard.verdict !== "execute") {
    throw new Error("Run must have an execute guard verdict before live broadcast.");
  }

  const fromToken = strategy.tokens[0]?.symbol || "USDC";
  const toToken = strategy.tokens[1]?.symbol || "USDT";
  const amount = parseAmountLabel(strategy.maxAmountLabel);
  const wallet = process.env.PERMIT_CHECKOUT_AGENTIC_WALLET || process.env.EXECUTION_GUARD_WALLET || "default";
  const chain = process.env.PERMIT_CHECKOUT_CHAIN || process.env.ONCHAINOS_CHAIN_INDEX || "196";

  const result = await runCommand("python3", [
    RUNNER,
    "--agent",
    strategy.creator,
    "--intent-id",
    run.permitId,
    "--from",
    fromToken,
    "--to",
    toToken,
    "--amount",
    amount,
    "--amount-mode",
    "readable",
    "--execution-mode",
    "agentic-wallet",
    "--wallet",
    wallet,
    "--chain",
    chain,
    "--reason",
    `Permit Checkout live execution for ${run.permitId}`,
  ]);

  const combinedOutput = [result.stdout, result.stderr].filter(Boolean).join("\n");
  const parsed = extractJsonFromText(combinedOutput);
  const txHash = findTxHash(parsed) || findTxHash(combinedOutput);
  const execution = parsed && typeof parsed === "object"
    ? (parsed as Record<string, unknown>).execution as Record<string, unknown> | undefined
    : undefined;
  const executionStatus = typeof execution?.status === "string" ? execution.status : "unknown";
  const executionError = typeof execution?.error === "string" ? execution.error : "";

  if (result.code !== 0) {
    throw new Error(executionError || combinedOutput.trim() || `Agentic Wallet runner exited with ${result.code}.`);
  }

  if (!txHash) {
    throw new Error(
      executionError ||
        "Agentic Wallet finished without a transaction hash. Check `onchainos wallet status` in this environment.",
    );
  }

  return {
    txHash,
    explorerUrl: `${XLAYER_EXPLORER_TX}/${txHash}`,
    executionStatus,
    proof: parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : { raw: combinedOutput },
    resultLabel: strategy.receipt.assetFlow,
  };
}
