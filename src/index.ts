import ts, {
    Expression,
    createDiagnosticCollection,
    factory,
} from "typescript";
import {} from "ts-expose-internals";
declare global {
    interface TransformerConfig {}
}

export = (program: ts.Program, config: TransformerConfig) => {
    const tc = program.getTypeChecker();
    const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
        return (file) => {
            function visitNode<T extends ts.Node>(node: T): T {
                if (ts.isExpression(node)) {
                    return visitExpression(node) as never as T;
                }

                return ts.visitEachChild(node, visitNode, context);
            }

            function visitExpression(node: ts.Expression): ts.Expression {
                const ty = tc.getTypeAtLocation(node);
                if (ty.isNullableType()) {
                    context.addDiagnostic(
                        ts.createDiagnosticForNode(node, {
                            code: 9999,
                            category: ts.DiagnosticCategory.Error,
                            message: "Expression is or might be undefined",
                            key: "",
                        })
                    );
                    return node;
                }
                if (ts.isAccessExpression(node)) {
                    if (node.questionDotToken) {
                        const ty = tc.getTypeAtLocation(node.expression);
                        if (ty.isNullableType()) {
                            context.addDiagnostic(
                                ts.createDiagnosticForNode(node, {
                                    code: 9999,
                                    category: ts.DiagnosticCategory.Error,
                                    message:
                                        "Expression is or might be undefined",
                                    key: "",
                                })
                            );
                            return node;
                        }
                    }
                }

                return ts.visitEachChild(node, visitNode, context);
            }
            return visitNode(file);
        };
    };
    return transformer;
};
