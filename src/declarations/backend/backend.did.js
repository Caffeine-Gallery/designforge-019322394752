export const idlFactory = ({ IDL }) => {
  return IDL.Service({
    'listDesigns' : IDL.Func([], [IDL.Vec(IDL.Text)], ['query']),
    'loadDesign' : IDL.Func([IDL.Text], [IDL.Opt(IDL.Text)], ['query']),
    'saveDesign' : IDL.Func([IDL.Text, IDL.Text], [], []),
  });
};
export const init = ({ IDL }) => { return []; };
