<?php

include_once(__DIR__ . '/../conexao/conexao_estoque.php'); 
include_once(__DIR__ . '/../conexao/conexao_publico.php'); 
include_once(__DIR__ . '/../conexao/conexao_vendas.php');

class Precos{
    private $conexao_publico;
    private $conexao_estoque;
    private $conexao_vendas;

    private array $ini;
public $ApplicationToken;
public $CompanyToken;		
public $url;


public function getConexao_publico(): CONEXAOPUBLICO{
	return $this->conexao_publico;
}

public function getConexao_estoque(): CONEXAOESTOQUE{
	return $this->conexao_estoque;
}
public function getConexao_vendas(): CONEXAOVENDAS{
	return $this->conexao_vendas;
}

public function __construct(){
    $this->conexao_publico = new CONEXAOPUBLICO();
        $this->conexao_vendas = new CONEXAOVENDAS();
        $this->conexao_estoque = new CONEXAOESTOQUE();


         $this->ini = parse_ini_file(__DIR__ . '/../conexao.ini', true);
         $ini = parse_ini_file(__DIR__ . '/../conexao.ini', true);
             if ($ini === false) {
                 die('Erro ao ler arquivo ini.');
             }
         $this->ApplicationToken = $this->ini['conexao']['ApplicationToken'];
         $this->CompanyToken = $this->ini['conexao']['CompanyToken'];
         $this->url = $this->ini['conexao']['url'];
}

    public function InsereTabelaPrecoProduto() {
	set_time_limit(0); // Tempo máximo de execução em segundos

		date_default_timezone_set('America/Sao_Paulo');
        
        $i = 0;
   
        $buscaTabPreco = $this->conexao_publico->Consulta("SELECT 
                                                                (ptp.PROMOCAO * up.FATOR_VAL) as PRECO_PROMOCAO, p.DESCRICAO as DESC_PROD, ptp.VALID_PROM,
                                                                ppm.codigo_bd as CODIGO_PP_MERCOS,
                                                                ppm.codigo_site as ID_SITE,	
                                                                p.CODIGO as CODIGOPROD_BD,
                                                                tp.CODIGO as CODIGO_PRECO_BD, 
                                                                ptp.PRECO as PRECO_BD, 
                                                                prem.codigo_site as PRECO_SITE, 
                                                                prom.codigo_site as PROD_SITE, 
                                                                p.CODIGO as PROD_CODIGO,
                                                                ppm.DATA_RECAD as DATARECAD_SITE, 
                                                                ptp.DATA_RECAD as DATARECAD_BD,
                                                                TRUNCATE(ptp.PRECO * up.FATOR_VAL, 4) as PRECO,  
                                                                prem.codigo_site as COD_PRECO_SITE    
                                                                from tab_precos tp
                                                                inner join preco_mercos prem on prem.codigo_bd = tp.CODIGO
                                                                inner join prod_tabprecos ptp on tp.CODIGO = ptp.TABELA
                                                                inner join cad_prod p on p.CODIGO = ptp.PRODUTO and p.ATIVO = 'S' and p.NO_SITE ='S'
                                                                inner join produto_mercos prom on prom.codigo_bd = p.CODIGO
                                                                left join unid_prod up on up.produto = p.CODIGO and up.PADR_SAI = 'S'
                                                                left join prod_preco_mercos ppm on ppm.produto_bd = p.CODIGO and ppm.preco_bd = tp.CODIGO
                                                               
                                                                where tp.ATIVO = 'S'  ");								
                while($row = mysqli_fetch_array($buscaTabPreco, MYSQLI_ASSOC)){ 
                    
                    $id_site  = $row['ID_SITE'];
                    $tabela_id  = $row['PRECO_SITE'];
                    $produto_id = $row['PROD_SITE'];
                    $preco_bd = number_format($row['PRECO_BD'] ,2);
                    $preco_produto = number_format($row['PRECO'] ,2);
                    $produto_codigo = $row['CODIGOPROD_BD'];
                    if($row['DATARECAD_SITE'] == ''){
                    $datarecadsite = '';
                    }else{
                        $datarecadsite = new DateTime($row['DATARECAD_SITE']);
                        $datarecadsite = date_format($datarecadsite, 'Y-m-d H:i:s');
                    }
                    $datarecadbanco = new DateTime($row['DATARECAD_BD']);
                    $datarecadbanco = date_format($datarecadbanco, 'Y-m-d H:i:s');
                    if($row['CODIGO_PP_MERCOS'] != ''){
                        //echo "ATUALIZA";
                        //UPDATE DE TABELA DE PRECO

                            
                            
                            echo '<h3 style="color:green;"><b>TABELA DE PREÇO DO PRODUTO '.$produto_codigo.' - DA TABELA ' .$preco_bd.' '.' JA EXISTE, VERIFICANDO DATA DE RECADASTRO PARA ATUALIZAR TABELA DE PREÇO DO PRODUTO</b></h3>';
                            echo"$datarecadbanco > $datarecadsite"; 
                            if(($datarecadbanco > $datarecadsite) || ($datarecadsite == '') || ($datarecadsite == NULL)){
                                        
                                    $ch = curl_init();
                                    curl_setopt_array($ch, array(
                                    CURLOPT_URL => $this->url."/v1/produtos_tabela_preco/".$id_site,
                                    CURLOPT_RETURNTRANSFER => true,
                                    CURLOPT_ENCODING => "",
                                    CURLOPT_MAXREDIRS => 10,
                                    CURLOPT_TIMEOUT => 0,
                                    CURLOPT_FOLLOWLOCATION => true,
                                    CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
                                    CURLOPT_CUSTOMREQUEST => "PUT",
                                    CURLOPT_POSTFIELDS =>"{\r\n  \"tabela_id\": \"$tabela_id\",\r\n  \"produto_id\": \"$produto_id\",\r\n  \"preco\": $preco_produto\r\n }",
                                    CURLOPT_HTTPHEADER => array(
                                        $this->ApplicationToken,
                                        $this->CompanyToken,
                                        "Content-Type: application/json"
                                    ),
                                    ));

                                    $response = curl_exec($ch);
                                    $resultado = json_decode($response);
                                    $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                                    
                                    while($httpcode == 429){
                                        $tempoRestante = $resultado->tempo_ate_permitir_novamente;
                                        echo '<h3 style="color:gray;"><b>aguarde '.$tempoRestante.' segundos para atualizar novamente</b></h3>';
                                        sleep($tempoRestante);
                                        $response = curl_exec($ch);
                                        $resultado = json_decode($response);	
                                        $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                                    }
                                    if($httpcode == 200 || $httpcode == 201) {
                                        echo '<h3 style="color:green;"><b>TABELA DE PRECO DO PRODUTO ALTERADO NO MERCOS</b></h3>';	
                                    } else {
                                        echo '<h3 style="color:red;"><b>FALHA AO ALTERAR TABELA DE PRECO DO PRODUTO:'.$produto_id.' - PRECO:'.$preco_bd.' NO MERCOS</b></h3>';	
                                        echo '<br>';
                                        echo '<h3 style="color:red;"><b>'.print_r($response).'</b></h3>'; 
                                        echo '<br>';
                                        print_r("{\r\n  \"tabela_id\": \"$tabela_id\",\r\n  \"produto_id\": \"$produto_id\",\r\n  \"preco\": $preco_produto\r\n }");
                                    }
                                    curl_close($ch);	
                                    
                                    $sql = $this->conexao_publico->Consulta("UPDATE prod_preco_mercos SET data_recad = '$datarecadbanco' where codigo_site = '$id_site'");
                                    if($sql == 1){
        //										echo '<h3 style="color:blue;"><b>TABELA DE PREÇO PRODUTO ALTERADO NO BANCO COM SUCESSO!</h3></b>';
                                        echo '<br>';	
                                    } else {
        //										echo '<h3 style="color:red;"><b>FALHA AO ALTERAR TABELA DE PREÇO PRODUTO NO BANCO!</h3></b>';
                                        echo '<br>';	
                                    }
                                    $valor_desconto = $row['PRECO_PROMOCAO'];
                                    $valor_total =  $row['PRECO_BD']; 

                                    if($valor_desconto > 0 && $valor_total > 0){											
                                        $preco_especial  = (($valor_total - $valor_desconto) * 100) /  $valor_total;
                                        $preco_validoAte = new DateTime($row['VALID_PROM']);
                                        $preco_validoAte = date_format($preco_validoAte, 'Y-m-d');
                                        
                                        $prod_nome = $row['DESC_PROD'];
                                        $hoje = date("Y-m-d");
                                        //echo"strtotime($preco_validoAte) >= strtotime($hoje)) and ($preco_especial > 0)";
                                        if((strtotime($preco_validoAte) >= strtotime($hoje)) and ($preco_especial > 0)){
                                            $this->InserePromocao($produto_id, $prod_nome, $preco_validoAte, $preco_especial, $produto_codigo);
                                        } 
                                    }else{
                                        echo "O valor da promoção está zerado";
                                    }
                                        
                            
                            } else {									
                                echo '<h3 style="color:blue;"><b>TABELA DE PREÇO DO PRODUTO JA ESTA ATUALIZADO!</h3></b>';
                                echo '<br>';		
                            }
                    } else {
                        //INSERE PRECO DO PRODUTO
                        $ch = curl_init();
                        curl_setopt($ch, CURLOPT_URL, $this->url."/v1/produtos_tabela_preco");
                        curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
                        curl_setopt($ch, CURLOPT_HEADERFUNCTION,
                        function($ch, $header) use (&$headers)
                        {
                            $len = strlen($header);
                            $header = explode(':', $header, 2);
                            if (count($header) < 2) // ignore invalid headers
                            return $len;

                            $headers[strtolower(trim($header[0]))][] = trim($header[1]);

                            return $len;
                        }
                        );

                        curl_setopt($ch, CURLOPT_POST, TRUE);

                        curl_setopt($ch, CURLOPT_POSTFIELDS, "{
                        \"tabela_id\": $tabela_id,
                        \"produto_id\": $produto_id,
                        \"preco\": $preco_produto
                        }");

                        curl_setopt($ch, CURLOPT_HTTPHEADER, array(
                        $this->ApplicationToken,
                        $this->CompanyToken,	
                        "Content-Type: application/json"
                        ));

                        $response = curl_exec($ch);
                        $resultado = json_decode($response);
                        $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                        while($httpcode == 429){
                            $tempoRestante = $resultado->tempo_ate_permitir_novamente;
                            echo '<h3 style="color:gray;"><b>aguarde '.$tempoRestante.' segundos para atualizar novamente</b></h3>';
                            sleep($tempoRestante);
                            $response = curl_exec($ch);
                            $resultado = json_decode($response);	
                            $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                        }
                        curl_close($ch);
                        if($httpcode == 200 || $httpcode == 201) {
                            $idPrecoProd = $headers['meuspedidosid'][$i];
                            echo '<h3 style="color:green;"><b>TABELA DE PRECO PRODUTO:'.$produto_id.' -  ID MERCOS '.$idPrecoProd. ' PREÇO '.$preco_produto.' INSERIDO NO MERCOS</b></h3>';	
                            echo"<br>";
                            
                            
                            $inserePrecoProduto = $this->conexao_publico->Consulta(" SELECT  FORMAT(ptp.PROMOCAO, 2) as PRECO_PROMOCAO, p.DESCRICAO as DESC_PROD, ptp.VALID_PROM, ppm.codigo_site, p.CODIGO, ptp.TABELA, ptp.DATA_RECAD from cad_prod p 
                                                                            inner join produto_mercos pm on pm.codigo_bd = p.CODIGO 
                                                                            inner join prod_tabprecos ptp on ptp.PRODUTO = p.CODIGO 
                                                                            inner join tab_precos tp on tp.CODIGO = ptp.TABELA 
                                                                            inner join preco_mercos prem on prem.codigo_bd = ptp.TABELA 
                                                                            left join prod_preco_mercos ppm on ppm.produto_site = pm.codigo_site  and 
                                                                            ppm.preco_site = prem.codigo_site
                                                                            where prem.codigo_site = $tabela_id and pm.codigo_site= $produto_id");
                            echo"<br>";													
                            $retorno = mysqli_num_rows($inserePrecoProduto);
                    
                            if($retorno > 0 ){
                                while($row3 = mysqli_fetch_array($inserePrecoProduto, MYSQLI_ASSOC)){	
                                    $id = $row3['codigo_site'];	
                                    $produto_codigo =  $row3['CODIGO'];	
                                    $preco_produto  =  $row3['TABELA'];
                                    $datarecadbanco = $row3['DATA_RECAD'];
                                    if(($id == '') and ($produto_codigo != "") &&($preco_produto != "")){
                                        $sql = $this->conexao_publico->Consulta("INSERT INTO prod_preco_mercos (codigo_site, produto_bd, produto_site, preco_bd, preco_site, DATA_RECAD)
                                                                                VALUES ('$idPrecoProd',
                                                                                        '$produto_codigo',
                                                                                        '$produto_id',
                                                                                        '$preco_produto',
                                                                                        '$tabela_id',
                                                                                        '$datarecadbanco')");
                                        if($sql == 1){
                                            echo '<h3 style="color:blue;"><b>PRECO DO PRODUTO:'.' '.$produto_codigo.' - '.$preco_produto.' '.'INSERIDO NO BANCO COM SUCESSO!</h3></b>';
                                            echo '<br>';	
                                        } else {
                                            echo '<h3 style="color:red;"><b>FALHA AO INSERIR PRECO DE PRODUTO NO BANCO!</h3></b>';
                                            echo '<br>';	
                                        }
                                    }
                                    $valor_desconto = $row['PRECO_PROMOCAO'];
                                    $valor_total =  $row['PRECO_BD']; 

                                    if($valor_desconto > 0){											
                                        $preco_especial  = (($valor_total - $valor_desconto) * 100) /  $valor_total;
                                        $preco_validoAte = new DateTime($row['VALID_PROM']);
                                        $preco_validoAte = date_format($preco_validoAte, 'Y-m-d');
                                        
                                        $prod_nome = $row['DESC_PROD'];
                                        $hoje = date("Y-m-d");
                                        //echo"strtotime($preco_validoAte) >= strtotime($hoje)) and ($preco_especial > 0)";
                                        if((strtotime($preco_validoAte) >= strtotime($hoje)) and ($preco_especial > 0)){
                                            $this->InserePromocao($produto_id, $prod_nome, $preco_validoAte, $preco_especial, $produto_codigo);
                                        } 
                                    }else{
                                        echo "O valor da promoção está zerado";
                                    }									
                                }	
                            }
                            $i++;	
                        } else {
                            echo '<h3 style="color:red;"><b>FALHA AO INSERIR TABELA DE PRECO PRODUTO:'.$produto_id.' - PRECO:'.$tabela_id.'  NO MERCOS</b></h3>';
                            echo '<br>';
                            echo '<h3 style="color:red;"><b>'.print_r($response).'</b></h3>'; 	
                            echo '<br>';
                            echo 'CODE: '.$httpcode;
                            echo"{
                                \"tabela_id\": $tabela_id,
                                \"produto_id\": $produto_id,
                                \"preco\": $preco_produto
                                }";
                        }
                    }	
                                    
                }		

}



public function InserePromocao($produto_id, $produto_nome, $preco_validoAte, $preco_especial, $produto_codigo) {
    set_time_limit(0); // Tempo máximo de execução em segundos

        $produto_nome = addslashes($produto_nome);
        $produto_nome = str_replace("\'", "'", $produto_nome);
        $produto_nome = utf8_encode($produto_nome);
        $busca_promo = $this->conexao_publico->Consulta("SELECT id, codigo_prod_site, codigo_prod_bd, validade, data_recad, slug, id_promo from promocao_mercos where codigo_prod_bd = $produto_codigo");
        $retornoPromo = mysqli_num_rows($busca_promo);
        while($row = mysqli_fetch_array($busca_promo, MYSQLI_ASSOC)){
            $idPromo  = $row['id_promo'];
            $slug = $row['slug'];
        }
        if($retornoPromo > 0){
            $dataInclusao = date("Y-m-d");
            $preco_especial = number_format($preco_especial , 4, '.', '');
            $curl = curl_init();
                curl_setopt_array($curl, array(
                CURLOPT_URL => $this->url."/v1/promocoes/$idPromo",
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HEADERFUNCTION =>
                function($ch, $header) use (&$headers)
                {
                $len = strlen($header);
                $header = explode(':', $header, 2);
                if (count($header) < 2) // ignore invalid headers
                    return $len;

                $headers[strtolower(trim($header[0]))][] = trim($header[1]);

                return $len;
                },						
                CURLOPT_ENCODING => "",
                CURLOPT_MAXREDIRS => 10,
                CURLOPT_TIMEOUT => 0,
                CURLOPT_FOLLOWLOCATION => true,				
                CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
                CURLOPT_CUSTOMREQUEST => "PUT",
                CURLOPT_POSTFIELDS =>"{ 
                    \r\n\"nome\": \"$produto_nome\", 
                    \r\n\"data_inicial\": \"$dataInclusao\", 
                    \r\n\"data_final\": \"$preco_validoAte\", 
                    \r\n\"regras\": \r\n  
                        [ 
                            \r\n   
                            { 
                                \r\n\"produto_id\": $produto_id, 
                                \r\n\"desconto\": $preco_especial \r\n    
                            } 
                            \r\n
                        ] 
                    \r\n
                }",
                CURLOPT_HTTPHEADER => array(
                    $this->ApplicationToken,
                    $this->CompanyToken,
                    "Content-Type: application/json"
                ),
            ));			
            $response = curl_exec($curl);
            $resultado = json_decode($response);
            echo "<br>";
            $httpcode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
            echo"<br>";
            echo"CODE:$httpcode";
            while($httpcode == 429){
                $tempoRestante = $resultado->tempo_ate_permitir_novamente;
                echo '<h3 style="color:gray;"><b>aguarde '.$tempoRestante.' segundos para atualizar novamente</b></h3>';
                sleep($tempoRestante);
                $response = curl_exec($curl);
                $resultado = json_decode($response);	
                $err = curl_error($curl);
                $httpcode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
            }
            if($httpcode == 200 || $httpcode == 201) {
                echo '<h3 style="color:green;"><b>PROMOCAO ATUALIZADA NO MERCOS</b></h3>';				
                $newIdPromo = $headers['meuspedidosid'][0];		
                $sql = $this->conexao_publico->Consulta("UPDATE promocao_mercos SET data_recad = '$dataInclusao', id_promo ='$newIdPromo' where id_promo = '$idPromo'");
                print_r("UPDATE promocao_mercos SET data_recad = '$dataInclusao' where id_promo = '$idPromo'");
                    
                if($sql == 1){
                    echo '<h3 style="color:green;"><b>PROMOCAO ATUALIZADA NO REGISTRO BANCO DE DADOS INTERSIG/MERCOS</b></h3>';	
                    echo '<br>';	
                } else {
                    echo '<h3 style="color:red;"><b>FALHA AO ATUALIZAR NO REGISTRO BANCO DE DADOS INTERSIG/MERCOS</b></h3>';	
                    echo '<br>';	
                }	
            } else {
                echo '<h3 style="color:red;"><b>FALHA AO ATUALIZAR PROMOCAO NO MERCOS</b></h3>';	
                echo '<br>';
                //echo '<h3 style="color:red;"><b>'.print_r($response).'</b></h3>'; 
            }
        
        curl_close($curl);
        }else{
            echo"INSERE PROMOCAO";
            $dataInclusao = date("Y-m-d");
            $preco_especial = number_format($preco_especial , 4, '.', '');
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $this->url."/v1/promocoes");
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
            curl_setopt($ch, CURLOPT_HEADERFUNCTION,
                        function($ch, $header) use (&$headers)
                        {
                            $len = strlen($header);
                            $header = explode(':', $header, 2);
                            if (count($header) < 2) // ignore invalid headers
                            return $len;

                            $headers[strtolower(trim($header[0]))][] = trim($header[1]);

                            return $len;
                        }
                        );
            curl_setopt($ch, CURLOPT_POST, TRUE);
            
            curl_setopt($ch, CURLOPT_POSTFIELDS, "{
            \"nome\": \"$produto_nome\",
            \"data_inicial\": \"$dataInclusao\",
            \"data_final\": \"$preco_validoAte\",
            \"regras\": [
                {
                \"produto_id\": $produto_id,
                \"desconto\": $preco_especial
                }
            ]
            }");

            curl_setopt($ch, CURLOPT_HTTPHEADER, array(
            $this->ApplicationToken,
            $this->CompanyToken,	
            "Content-Type: application/json"
            ));
            /*
            echo"{
            \"nome\": \"$produto_nome\",
            \"slug\": \"$produto_id-slug\",
            \"data_inicial\": \"$dataInclusao\",
            \"data_final\": \"$preco_validoAte\",
            \"regras\": [
                {
                \"produto_id\": $produto_id,
                \"desconto\": $preco_especial
                }
            ]
            }";
            */
            $response = curl_exec($ch);	
            $idPromocaoMercos = $headers['meuspedidosid'][0];	
            
            //print_r($response);
            $err = curl_error($ch);
            $resultado = json_decode($response);
            $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            echo"<br>";
            echo"CODE:$httpcode";
            while($httpcode == 429){
                $tempoRestante = $resultado->tempo_ate_permitir_novamente;
                echo '<h3 style="color:gray;"><b>aguarde '.$tempoRestante.' segundos para atualizar novamente</b></h3>';
                sleep($tempoRestante);
                $response = curl_exec($ch);
                $resultado = json_decode($response);	
                $err = curl_error($ch);
                $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            }
            if($httpcode == 200 || $httpcode == 201) {
                echo '<h3 style="color:green;"><b>PROMOCAO INSERIDOO NO MERCOS</b></h3>';			
                $sql = $this->conexao_publico->Consulta("INSERT INTO promocao_mercos (codigo_prod_site, codigo_prod_bd, validade, data_recad, id_promo)
                                VALUES ('$produto_id',
                                        '$produto_codigo',
                                        '$preco_validoAte',
                                        '$dataInclusao',
                                        '$idPromocaoMercos')");	
                                        
                /*
                print_r("INSERT INTO promocao_mercos (codigo_prod_site, codigo_prod_bd, validade, data_inclusao, slug)
                VALUES ('$produto_id',
                        '$produto_codigo',
                        '$preco_validoAte',
                        '$dataInclusao',
                        '$produto_id-slug')");
                */		
                if($sql == 1){
                    echo '<h3 style="color:green;"><b>PROMOCAO INSERIDO NO REGISTRO INTERSIG/MERCOS</b></h3>';	
                    echo '<br>';	
                } else {
                    echo '<h3 style="color:red;"><b>FALHA AO INSERIR NO REGISTRO INTERSIG/MERCOS</b></h3>';	
                    echo '<br>';	
                }	
            } else {
                echo '<h3 style="color:red;"><b>FALHA AO INSERIR PROMOCAO NO MERCOS</b></h3>';	
                echo '<br>';
                echo '<h3 style="color:red;"><b>'.print_r($response).'</b></h3>'; 
            }
            curl_close($ch);
        }
    }

}



?>