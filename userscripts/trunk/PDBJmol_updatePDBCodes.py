import re

from ftplib import FTP
from pprint import pprint
from StringIO import StringIO

import simplejson # 3rd party library for JSON

def getPDBfromRCSB():
    """Download list of PDB codes from the PDB."""
    
    ftp = FTP('ftp.rcsb.org')
    ftp.login('anonymous')
    ftp.cwd('/pub/pdb/derived_data/')
    download = StringIO()
    ftp.retrbinary("RETR pdb_entry_type.txt", download.write)
    ftp.quit()
    pdbcodes = [x.split("\t")[0] for x in download.getvalue().split("\n")]
    assert pdbcodes[-1] == ''
    return pdbcodes[:-1] # Remove last item

if __name__=="__main__":
    pdbcodes = getPDBfromRCSB()
    print "In total, there are %d PDB codes." % len(pdbcodes)
    
    # Find all those that don't match the regexp for 99% of PDBCodes
    p = re.compile("(\d[a-zA-Z][a-zA-Z0-9][a-zA-Z0-9])")
    ans = [x for x in pdbcodes if not p.match(x)]
    print "There are %d PDB codes that don't match the general regexp." % len(ans)

    # Print it out nice, once as an array and once as a single string
    # for inclusion in PDBJmol.user.js and other scripts
    print simplejson.dumps(ans)
    print simplejson.dumps("-".join(ans))