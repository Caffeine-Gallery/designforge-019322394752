export const idlFactory = ({ IDL }) => {
  return IDL.Service({
    'deleteDesign' : IDL.Func([IDL.Text], [IDL.Bool], []),
    'getDesignVersion' : IDL.Func([IDL.Text], [IDL.Opt(IDL.Nat)], ['query']),
    'listDesigns' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Int, IDL.Nat))],
        ['query'],
      ),
    'loadDesign' : IDL.Func([IDL.Text], [IDL.Opt(IDL.Text)], ['query']),
    'saveDesign' : IDL.Func([IDL.Text, IDL.Text], [], []),
  });
};
export const init = ({ IDL }) => { return []; };
