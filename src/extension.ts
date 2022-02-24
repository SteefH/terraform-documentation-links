import * as vscode from 'vscode';

type TerraformDataOrResource = "data" | "resource";

const resourceRe = /^(?<match>(?<prefix>\s*(?<dataOrResource>resource|data)\s+")(?<resourceType>[^"]+))"/;

type LineMatchResult = {
  range: vscode.Range,
  dataOrResource: TerraformDataOrResource,
  resourceType: string
};

const resourceLineMatcher: (line: vscode.TextLine) => LineMatchResult | undefined = (line: vscode.TextLine) => {
  const matchResult = resourceRe.exec(line.text);
  if (!matchResult) {
    return;
  };
  const { prefix, dataOrResource, resourceType, match } = matchResult.groups || {};
  const prefixLength: number = prefix!.length;
  const matchLength: number = match!.length;
  return {
    range: new vscode.Range(
      new vscode.Position(line.lineNumber, prefixLength),
      new vscode.Position(line.lineNumber, matchLength)
    ),
    dataOrResource: dataOrResource as TerraformDataOrResource,
    resourceType
  };
};

const resourceTypeToProviderAndName: (resourceType: string) => { provider: string, name: string } | undefined =
  (resourceType) => {
    const re = /^(?<provider>[^_]+)_(?<name>.*)$/;
    const m = re.exec(resourceType);
    if (!m) { return; }

    const { provider = "", name = "" } = m.groups || {};
    return { provider, name };
  };

const getLineMatchResultUri: (lmr: LineMatchResult) => vscode.Uri | undefined =
  ({ dataOrResource, resourceType }) => {
    const { provider, name } = resourceTypeToProviderAndName(resourceType) || {};
    if (!provider || !name) { return; }
    return vscode.Uri.parse(`https://www.terraform.io/docs/providers/${provider}/${dataOrResource.charAt(0)}/${name}`);
  };

function isNotUndefined<T>(v: T | undefined): v is T {
  return v !== undefined;
}

const linkProvider: vscode.DocumentLinkProvider = {
  provideDocumentLinks(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.DocumentLink[]> {
    const res: Array<LineMatchResult> = [];

    for (let ln = 0; ln < document.lineCount; ln++) {
      const lineMatchResult = resourceLineMatcher(document.lineAt(ln));
      console.log("LINE", document.lineAt(ln));
      if (lineMatchResult) {
        console.log("LMR", lineMatchResult);
        res.push(lineMatchResult);
      }
    }

    return res.map(lmr => {
      const uri = getLineMatchResultUri(lmr);
      if (!uri) { return; }

      const ln = new vscode.DocumentLink(
        lmr.range, uri
      );
      ln.tooltip = uri.toString();
      return ln;
    }).filter(isNotUndefined);
  }
};

export function activate(context: vscode.ExtensionContext) {
  const disposeLinkProvider = vscode.languages.registerDocumentLinkProvider('terraform', linkProvider);
  context.subscriptions.push(disposeLinkProvider);
}
